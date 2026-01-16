export interface Point { x: number; y: number; }

export interface Stroke {
    id: string;
    points: Point[];
    color: string;
    width: number;
}

export class DrawingState {
    private history: Stroke[] = [];
    private redoStack: Stroke[] = [];
    private activeStrokes: Record<string, Stroke> = {};

    constructor() { }

    public getHistory() {
        return this.history;
    }

    public startStroke(userId: string, id: string, x: number, y: number, color: string, width: number) {
        // Clear redo stack on new action
        this.redoStack.length = 0;

        this.activeStrokes[userId] = {
            id,
            points: [{ x, y }],
            color,
            width
        };
        return this.activeStrokes[userId];
    }

    public addPoint(userId: string, x: number, y: number) {
        const stroke = this.activeStrokes[userId];
        if (stroke) {
            stroke.points.push({ x, y });
            return stroke;
        }
        return null;
    }

    public endStroke(userId: string) {
        const stroke = this.activeStrokes[userId];
        if (stroke) {
            this.history.push(stroke);
            delete this.activeStrokes[userId];
            return stroke;
        }
        return null;
    }

    public undo() {
        if (this.history.length > 0) {
            const removed = this.history.pop();
            if (removed) {
                this.redoStack.push(removed);
                return removed;
            }
        }
        return null;
    }

    public redo() {
        if (this.redoStack.length > 0) {
            const restored = this.redoStack.pop();
            if (restored) {
                this.history.push(restored);
                return restored;
            }
        }
        return null;
    }

    public clear() {
        this.history.length = 0;
        this.redoStack.length = 0;
    }

    public removeUser(userId: string) {
        delete this.activeStrokes[userId];
    }
}
