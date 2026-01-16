export class CanvasManager {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private isDrawing: boolean = false;
    private points: { x: number; y: number }[] = [];

    // Settings
    public color: string = '#000000';
    public width: number = 3;

    constructor(canvasId: string) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }
        this.canvas = canvas;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2d context');
        }
        this.ctx = ctx;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    public resize() {
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
        }
    }

    public startDrawing(x: number, y: number) {
        this.isDrawing = true;
        this.points = [{ x, y }];
        this.drawDot(x, y, this.color, this.width);
    }

    public draw(x: number, y: number) {
        if (!this.isDrawing) return;
        this.points.push({ x, y });
        this.renderPoints(this.points, this.color, this.width);
    }

    public endDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.ctx.closePath();

        return {
            points: [...this.points],
            color: this.color,
            width: this.width
        };
    }

    public clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private drawDot(x: number, y: number, color: string, width: number) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    // Draw a segment based on the last few points in the array
    public renderPoints(points: { x: number, y: number }[], color: string, width: number) {
        this.ctx.save();
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = width;
        this.ctx.strokeStyle = color;

        if (points.length < 3) {
            // If single point, draw dot
            if (points.length === 1) {
                this.drawDot(points[0].x, points[0].y, color, width);
                return;
            }
            // Just draw line from prev to current
            if (points.length >= 2) {
                const b = points[points.length - 1];
                const a = points[points.length - 2];
                this.ctx.beginPath();
                this.ctx.moveTo(a.x, a.y);
                this.ctx.lineTo(b.x, b.y);
                this.ctx.stroke();
            }
        } else {
            const p1 = points[points.length - 3];
            const p2 = points[points.length - 2];
            const p3 = points[points.length - 1];

            const mid1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
            const mid2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };

            this.ctx.beginPath();
            this.ctx.moveTo(mid1.x, mid1.y);
            this.ctx.quadraticCurveTo(p2.x, p2.y, mid2.x, mid2.y);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    public drawStroke(stroke: { points: { x: number, y: number }[], color: string, width: number }) {
        if (!stroke.points || stroke.points.length === 0) return;

        this.ctx.save();
        this.ctx.strokeStyle = stroke.color;
        this.ctx.lineWidth = stroke.width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        const points = stroke.points;

        if (points.length === 1) {
            this.ctx.beginPath();
            this.ctx.arc(points[0].x, points[0].y, stroke.width / 2, 0, Math.PI * 2);
            this.ctx.fillStyle = stroke.color;
            this.ctx.fill();
        } else {
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, points[0].y);

            if (points.length < 3) {
                for (let i = 1; i < points.length; i++) {
                    this.ctx.lineTo(points[i].x, points[i].y);
                }
            } else {
                for (let i = 1; i < points.length - 1; i++) {
                    const midX = (points[i].x + points[i + 1].x) / 2;
                    const midY = (points[i].y + points[i + 1].y) / 2;
                    this.ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
                }
                this.ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
            }
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    // Shape drawing methods
    public drawRectangle(x1: number, y1: number, x2: number, y2: number, color: string, width: number, filled: boolean = false) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = width;

        if (filled) {
            this.ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        } else {
            this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        }

        this.ctx.restore();
    }

    public drawCircle(x1: number, y1: number, x2: number, y2: number, color: string, width: number, filled: boolean = false) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = width;

        const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        this.ctx.beginPath();
        this.ctx.arc(x1, y1, radius, 0, Math.PI * 2);

        if (filled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    public drawLine(x1: number, y1: number, x2: number, y2: number, color: string, width: number) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        this.ctx.restore();
    }
}
