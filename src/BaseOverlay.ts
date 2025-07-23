

export interface BaseOverlayOptions {
    canvas: HTMLCanvasElement;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    fontFamily?: string;
    textColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    labelOffset?: number;
    precision?: number;
}

export class BaseOverlay {
    protected canvas: HTMLCanvasElement;
    protected overlayCanvas: HTMLCanvasElement;
    protected ctx: CanvasRenderingContext2D;
    protected options: Required<BaseOverlayOptions>;
    protected animationId: number | null = null;
    protected isVisible: boolean = true;

    constructor(options: BaseOverlayOptions) {
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

    protected formatValue(value: number, precision: number): string {
        // Better formatting for scientific values
        if (Math.abs(value) >= 1000 || (Math.abs(value) < 0.01 && value !== 0)) {
            return value.toExponential(1);
        } else if (value % 1 === 0 && Math.abs(value) < 100) {
            return value.toString();
        } else {
            return value.toFixed(precision);
        }
    }

    protected render(): void {
        if (!this.isVisible) return;

        // Clear overlay canvas
        this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
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
    public getOptions(): Readonly<Required<BaseOverlayOptions>> {
        return { ...this.options };
    }

    public isShown(): boolean {
        return this.isVisible;
    }
}