import { BaseOverlay, BaseOverlayOptions } from './BaseOverlay'

export interface CompassOptions extends BaseOverlayOptions {
    cameraAngle: number
    opacity: number
    visible: boolean
    colors: {
        primary: string
        secondary: string
        accent: string
        background: string
        text: string
    }
}

export type CardinalDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'center'

/**
 * @brief A class to create a compass rose on an HTML canvas with navigation capabilities.
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on.
 * @param {Object} [options] - Configuration options for the compass.
 * @param {number} [options.x=100] - The x-coordinate of the compass center.
 * @param {number} [options.y=100] - The y-coordinate of the compass center.
 * @param {number} [options.size=60] - The size of the compass.
 * @param {number} [options.cameraAngle=0] - The angle of the camera in degrees.
 * @param {number} [options.opacity=0.9] - The opacity of the compass.
 * @param {boolean} [options.visible=true] - Whether the compass is visible.
 * @param {Object} [options.colors] - Custom colors for the compass.
 * @param {string} [options.colors.primary='#ff4444'] - Primary color for the compass.
 * @param {string} [options.colors.secondary='#ffffff'] - Secondary color for the compass.
 * @param {string} [options.colors.accent='#ffaa00'] - Accent color for the compass.
 * @param {string} [options.colors.background='rgba(0,0,0,0.4)'] - Background color for the compass.
 * @param {string} [options.colors.text='#ffffff'] - Text color for the compass labels.
 */
export class Compass2D extends BaseOverlay {
    protected options: Required<CompassOptions>;

    private onOrientationChange?: (direction: CardinalDirection, angle: number) => void

    constructor(options: CompassOptions) {
        super(options)

        this.options = {
            width: 200,
            height: 200,
            x: 100,
            y: 100,
            fontSize: 11,
            fontFamily: 'Arial, sans-serif',
            textColor: '#333333',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#cccccc',
            borderWidth: 1,
            labelOffset: 25,
            precision: 1,
            cameraAngle: options.cameraAngle ??= 45,
            opacity: options.opacity ??= 0.9,
            visible: options.visible ??= true,
            colors: {
                primary: options.colors.primary ??= '#ff4444',
                secondary: options.colors.secondary ??= '#ffffff',
                accent: options.colors.accent ??= '#ffaa00',
                background: options.colors.background ??= 'rgba(0,0,0,0.4)',
                text: options.colors.text ??= '#ffffff',
            },
            ...options
        }

        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        this.render()
    }

    private setPosition(x: number, y: number) {
        this.options.x = x
        this.options.y = y
    }

    public setPositionByName(positionName: string) {
        const margin = this.options.width + 20
        switch (positionName) {
            case 'top-right':
                this.setPosition(this.canvas.width - margin, margin)
                break
            case 'top-left':
                this.setPosition(margin, margin)
                break
            case 'bottom-right':
                this.setPosition(this.canvas.width - margin, this.canvas.height - margin)
                break
            case 'bottom-left':
                this.setPosition(margin, this.canvas.height - margin)
                break
            case 'center':
                this.setPosition(this.canvas.width / 2, this.canvas.height / 2)
                break
        }
    }

    // setupCanvas() {
    //     this.canvas.width = window.innerWidth
    //     this.canvas.height = window.innerHeight
    // }

    // setSize(size: number) {
    //     this.options.width = size
    // }

    setCameraAngle(angle: number) {
        this.options.cameraAngle = angle
    }

    setOpacity(opacity: number) {
        this.options.opacity = opacity
    }

    setVisible(visible: boolean) {
        this.options.visible = visible
    }

    /**
     * Set a callback function that will be called when orientation changes
     * @param callback Function to call with direction and angle parameters
     */
    setOrientationCallback(callback: (direction: CardinalDirection, angle: number) => void) {
        this.onOrientationChange = callback
    }

    /**
     * Get the angle for a cardinal direction
     * @param direction The cardinal direction
     * @returns The angle in degrees (0° = North, clockwise)
     */
    private getDirectionAngle(direction: CardinalDirection): number {
        const directions = {
            'N': 0,
            'NE': 45,
            'E': 90,
            'SE': 135,
            'S': 180,
            'SW': 225,
            'W': 270,
            'NW': 315,
            'center': this.options.cameraAngle // Keep current angle for center
        }
        return directions[direction]
    }

    /**
     * Get the current cardinal direction based on camera angle
     * @returns The closest cardinal direction
     */
    getCurrentDirection(): CardinalDirection {
        const normalizedAngle = ((this.options.cameraAngle % 360) + 360) % 360

        if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) return 'N'
        if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return 'NE'
        if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return 'E'
        if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return 'SE'
        if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) return 'S'
        if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) return 'SW'
        if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) return 'W'
        if (normalizedAngle >= 292.5 && normalizedAngle < 337.5) return 'NW'

        return 'N' // Default fallback
    }

    /**
     * Orient the compass (and trigger camera orientation) to a specific cardinal direction
     * @param direction The cardinal direction to orient to
     * @param smooth Whether to animate the transition (default: true)
     */
    orientToDirection(direction: CardinalDirection, smooth: boolean = true) {
        const targetAngle = this.getDirectionAngle(direction)

        if (smooth) {
            this.animateToAngle(targetAngle)
        } else {
            this.setCameraAngle(targetAngle)
            this.render()
        }

        // Trigger the orientation callback if set
        if (this.onOrientationChange) {
            this.onOrientationChange(direction, targetAngle)
        }
    }

    /**
     * Smoothly animate the compass to a target angle
     * @param targetAngle The target angle in degrees
     * @param duration The animation duration in milliseconds (default: 1000)
     */
    private animateToAngle(targetAngle: number, duration: number = 1000) {
        const startAngle = this.options.cameraAngle
        const startTime = Date.now()

        // Calculate the shortest rotation path
        let angleDiff = targetAngle - startAngle
        if (angleDiff > 180) angleDiff -= 360
        if (angleDiff < -180) angleDiff += 360

        const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Easing function (ease-in-out)
            const easeProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2

            const currentAngle = startAngle + (angleDiff * easeProgress)
            this.setCameraAngle(currentAngle)
            this.render()

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        animate()
    }

    /**
     * Get a list of all available cardinal directions
     * @returns Array of cardinal direction strings
     */
    getAvailableDirections(): CardinalDirection[] {
        return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'center']
    }

    drawArrow(angle: number, length: number, color: any, width = 2) {
        const ctx = this.ctx
        if (!ctx) return

        const radians = (angle + this.options.cameraAngle) * Math.PI / 180
        const endX = this.options.x + Math.cos(radians) * length
        const endY = this.options.y + Math.sin(radians) * length

        ctx.save()
        ctx.globalAlpha = this.options.opacity
        ctx.strokeStyle = color
        ctx.fillStyle = color
        ctx.lineWidth = width
        ctx.lineCap = 'round'

        // Draw arrow shaft
        ctx.beginPath()
        ctx.moveTo(this.options.x, this.options.y)
        ctx.lineTo(endX, endY)
        ctx.stroke()

        // Draw arrowhead
        const headLength = length * 0.25
        const headAngle = Math.PI / 6

        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(
            endX - headLength * Math.cos(radians - headAngle),
            endY - headLength * Math.sin(radians - headAngle)
        )
        ctx.moveTo(endX, endY)
        ctx.lineTo(
            endX - headLength * Math.cos(radians + headAngle),
            endY - headLength * Math.sin(radians + headAngle)
        )
        ctx.stroke()

        ctx.restore()
    }

    drawDirectionLabel(angle: number, text: string, distance: number) {
        const ctx = this.ctx
        if (!ctx) return

        const radians = (angle + this.options.cameraAngle) * Math.PI / 180
        const labelX = this.options.x + Math.cos(radians) * distance
        const labelY = this.options.y + Math.sin(radians) * distance

        ctx.save()
        ctx.globalAlpha = this.options.opacity
        ctx.fillStyle = this.options.colors.text
        ctx.font = `bold ${this.options.width * 0.2}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // Add text shadow for better readability
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 2
        ctx.shadowOffsetX = 1
        ctx.shadowOffsetY = 1

        ctx.fillText(text, labelX, labelY)
        ctx.restore()
    }

    drawTicks() {
        const ctx = this.ctx
        if (!ctx) return

        ctx.save()
        ctx.globalAlpha = this.options.opacity * 0.7

        // Draw major ticks (every 45 degrees)
        for (let i = 0; i < 360; i += 45) {
            const radians = (i + this.options.cameraAngle) * Math.PI / 180
            const innerRadius = this.options.width * 0.7
            const outerRadius = this.options.width * 0.85

            const x1 = this.options.x + Math.cos(radians) * innerRadius
            const y1 = this.options.y + Math.sin(radians) * innerRadius
            const x2 = this.options.x + Math.cos(radians) * outerRadius
            const y2 = this.options.y + Math.sin(radians) * outerRadius

            ctx.strokeStyle = this.options.colors.secondary
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
        }

        ctx.restore()
    }

    drawBackground() {
        const ctx = this.ctx
        if (!ctx) return

        ctx.save()
        ctx.globalAlpha = this.options.opacity

        // Draw compass background circle
        ctx.fillStyle = this.options.colors.background
        ctx.strokeStyle = this.options.colors.secondary
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(this.options.x, this.options.y, this.options.width, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()

        // Draw center dot
        ctx.fillStyle = this.options.colors.accent
        ctx.beginPath()
        ctx.arc(this.options.x, this.options.y, 3, 0, 2 * Math.PI)
        ctx.fill()

        ctx.restore()
    }

    render() {
        if (!this.options.visible || !this.ctx) return

        super.render()

        // Clear overlay canvas
        // this.ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        // Draw compass components
        this.drawBackground()
        this.drawTicks()

        // Draw cardinal directions
        this.drawArrow(0, this.options.width * 0.6, this.options.colors.primary, 3) // North
        this.drawArrow(180, this.options.width * 0.5, this.options.colors.secondary, 2) // South
        this.drawArrow(90, this.options.width * 0.5, this.options.colors.secondary, 2) // East
        this.drawArrow(270, this.options.width * 0.5, this.options.colors.secondary, 2) // West

        // Draw direction labels
        const labelDistance = this.options.width * 1.15
        this.drawDirectionLabel(0, 'N', labelDistance)
        this.drawDirectionLabel(90, 'E', labelDistance)
        this.drawDirectionLabel(180, 'S', labelDistance)
        this.drawDirectionLabel(270, 'W', labelDistance)
    }
}
