// src/ColorScale.ts

export interface ColorStop {
    position: number; // 0-1
    color: string;
}

export interface ColorScaleOptions {
    canvas: HTMLCanvasElement;
    x: number;
    y: number;
    width: number;
    height: number;
    min: number;
    max: number;
    attributeName: string;
    orientation: 'vertical' | 'horizontal';
    colorStops: ColorStop[];
    fontSize?: number;
    fontFamily?: string;
    textColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    labelOffset?: number;
    precision?: number;
}

export class ColorScale {
    private canvas: HTMLCanvasElement;
    private overlayCanvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private options: Required<ColorScaleOptions>;
    private animationId: number | null = null;
    private isVisible: boolean = true;

    constructor(options: ColorScaleOptions) {
        this.canvas = options.canvas;

        // Create overlay canvas
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.width = this.canvas.width;
        this.overlayCanvas.height = this.canvas.height;
        this.overlayCanvas.style.position = 'absolute';
        this.overlayCanvas.style.top = '0';
        this.overlayCanvas.style.left = '0';
        this.overlayCanvas.style.pointerEvents = 'none'; // Allow interaction with underlying canvas
        this.overlayCanvas.style.zIndex = '1000';

        // Position overlay on top of main canvas
        if (this.canvas.parentElement) {
            const parent = this.canvas.parentElement;
            if (getComputedStyle(parent).position === 'static') {
                parent.style.position = 'relative';
            }
            parent.appendChild(this.overlayCanvas);
        } else {
            document.body.appendChild(this.overlayCanvas);
        }

        const ctx = this.overlayCanvas.getContext('2d');
        if (!ctx) {
            throw new Error('Unable to get 2D context from overlay canvas');
        }
        this.ctx = ctx;

        // Set default values - updated for scientific appearance
        this.options = {
            fontSize: 11,
            fontFamily: 'Arial, sans-serif',
            textColor: '#333333',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#cccccc',
            borderWidth: 1,
            labelOffset: 25,
            precision: 1,
            ...options
        };

        this.render();
    }

    private createGradient(): CanvasGradient {
        const { x, y, width, height, orientation, colorStops } = this.options;

        let gradient: CanvasGradient;
        if (orientation === 'vertical') {
            gradient = this.ctx.createLinearGradient(0, y + height, 0, y);
        } else {
            gradient = this.ctx.createLinearGradient(x, 0, x + width, 0);
        }

        // Sort color stops by position
        const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);

        for (const stop of sortedStops) {
            gradient.addColorStop(stop.position, stop.color);
        }

        return gradient;
    }

    private drawScale(): void {
        const { x, y, width, height, backgroundColor, borderColor, borderWidth } = this.options;

        this.ctx.save();

        // Draw background with slight padding and rounded corners
        if (backgroundColor !== 'transparent') {
            const padding = 1;
            this.ctx.fillStyle = backgroundColor;
            this.roundRect(x - padding, y - padding, width + padding * 2, height + padding * 2, 1);
            this.ctx.fill();
        }

        // Draw gradient with subtle inner shadow effect
        const gradient = this.createGradient();
        this.ctx.fillStyle = gradient;
        this.roundRect(x, y, width, height, 1);
        this.ctx.fill();

        // Draw subtle border
        if (borderWidth > 0) {
            this.ctx.strokeStyle = borderColor;
            this.ctx.lineWidth = borderWidth;
            this.roundRect(x, y, width, height, 1);
            this.ctx.stroke();
        }

        // Add tick marks for better scientific appearance
        this.drawTickMarks();

        this.ctx.restore();
    }

    private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    private drawTickMarks(): void {
        const { x, y, width, height, orientation, borderColor } = this.options;
        const tickCount = 5;
        const tickLength = 4;

        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= tickCount; i++) {
            const position = i / tickCount;

            if (orientation === 'vertical') {
                const tickY = y + height - (position * height);
                this.ctx.beginPath();
                this.ctx.moveTo(x + width, tickY);
                this.ctx.lineTo(x + width + tickLength, tickY);
                this.ctx.stroke();
            } else {
                const tickX = x + (position * width);
                this.ctx.beginPath();
                this.ctx.moveTo(tickX, y + height);
                this.ctx.lineTo(tickX, y + height + tickLength);
                this.ctx.stroke();
            }
        }
    }

    private drawLabels(): void {
        const {
            x, y, width, height, min, max, orientation,
            fontSize, fontFamily, textColor, labelOffset, precision, attributeName
        } = this.options;

        this.ctx.save();
        this.ctx.fillStyle = textColor;
        this.ctx.font = `${fontSize}px ${fontFamily}`;

        // Draw intermediate values for more scientific appearance
        const valueCount = 5;
        const tickOffset = 8;

        if (orientation === 'vertical') {
            // Draw attribute name
            this.ctx.save();
            this.ctx.translate(x + width + labelOffset + fontSize * 2, y + height / 2);
            this.ctx.rotate(Math.PI / 2);
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(attributeName, 0, 0);
            this.ctx.restore();

            // Draw scale values
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';

            for (let i = 0; i <= valueCount; i++) {
                const position = i / valueCount;
                const value = min + (max - min) * (1 - position); // Inverted for vertical
                const labelY = y + position * height;
                const formattedValue = this.formatValue(value, precision);

                this.ctx.fillText(formattedValue, x + width + tickOffset, labelY);
            }
        } else {
            // Horizontal orientation
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(attributeName, x + width / 2, y - labelOffset - fontSize);

            // Draw scale values
            this.ctx.textBaseline = 'top';

            for (let i = 0; i <= valueCount; i++) {
                const position = i / valueCount;
                const value = min + (max - min) * position;
                const labelX = x + position * width;
                const formattedValue = this.formatValue(value, precision);

                this.ctx.fillText(formattedValue, labelX, y + height + tickOffset);
            }
        }

        this.ctx.restore();
    }

    private formatValue(value: number, precision: number): string {
        // Better formatting for scientific values
        if (Math.abs(value) >= 1000 || (Math.abs(value) < 0.01 && value !== 0)) {
            return value.toExponential(1);
        } else if (value % 1 === 0 && Math.abs(value) < 100) {
            return value.toString();
        } else {
            return value.toFixed(precision);
        }
    }

    private render(): void {
        if (!this.isVisible) return;

        // Clear overlay canvas
        this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        this.drawScale();
        this.drawLabels();
    }

    // Method to get color at specific value
    public getColorAtValue(value: number): string {
        const { min, max, colorStops } = this.options;

        // Normalize value to 0-1 range
        const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));

        // Find the appropriate color stops
        const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);

        if (normalizedValue <= sortedStops[0].position) {
            return sortedStops[0].color;
        }

        if (normalizedValue >= sortedStops[sortedStops.length - 1].position) {
            return sortedStops[sortedStops.length - 1].color;
        }

        // Interpolate between two stops
        for (let i = 0; i < sortedStops.length - 1; i++) {
            const stop1 = sortedStops[i];
            const stop2 = sortedStops[i + 1];

            if (normalizedValue >= stop1.position && normalizedValue <= stop2.position) {
                const t = (normalizedValue - stop1.position) / (stop2.position - stop1.position);
                return this.interpolateColor(stop1.color, stop2.color, t);
            }
        }

        return sortedStops[0].color;
    }

    private interpolateColor(color1: string, color2: string, t: number): string {
        // Simple RGB interpolation
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);

        if (!c1 || !c2) return color1;

        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);

        return `rgb(${r}, ${g}, ${b})`;
    }

    private hexToRgb(hex: string): { r: number, g: number, b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // Update methods
    public updatePosition(x: number, y: number): void {
        this.options.x = x;
        this.options.y = y;
        this.render();
    }

    public updateSize(width: number, height: number): void {
        this.options.width = width;
        this.options.height = height;
        this.render();
    }

    public updateRange(min: number, max: number): void {
        this.options.min = min;
        this.options.max = max;
        this.render();
    }

    public updateColorStops(colorStops: ColorStop[]): void {
        this.options.colorStops = colorStops;
        this.render();
    }

    public updateOrientation(orientation: 'vertical' | 'horizontal'): void {
        this.options.orientation = orientation;
        this.render();
    }

    public updateAttributeName(name: string): void {
        this.options.attributeName = name;
        this.render();
    }

    // Handle canvas resize
    public resize(width: number, height: number): void {
        this.overlayCanvas.width = width;
        this.overlayCanvas.height = height;
        this.render();
    }

    // Cleanup method
    public destroy(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.overlayCanvas.parentElement) {
            this.overlayCanvas.parentElement.removeChild(this.overlayCanvas);
        }
    }

    // Show/hide methods
    public show(): void {
        this.isVisible = true;
        this.overlayCanvas.style.display = 'block';
        this.render();
    }

    public hide(): void {
        this.isVisible = false;
        this.overlayCanvas.style.display = 'none';
    }

    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    // Method to redraw (useful for animation loops)
    public redraw(): void {
        this.render();
    }

    // Getters for current state
    public getOptions(): Readonly<Required<ColorScaleOptions>> {
        return { ...this.options };
    }

    public isShown(): boolean {
        return this.isVisible;
    }
}