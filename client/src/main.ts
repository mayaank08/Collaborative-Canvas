/// <reference types="vite/client" />
import { CanvasManager } from './CanvasManager';
import { SocketService } from './SocketService';
import './style.css';

// --- Initialization ---
const canvasManager = new CanvasManager('drawing-canvas');
const socketService = new SocketService(import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');
const cursorCanvas = document.getElementById('cursor-canvas') as HTMLCanvasElement;
const cursorCtx = cursorCanvas.getContext('2d')!;

// Resize cursor canvas
function resizeCursorCanvas() {
    const parent = cursorCanvas.parentElement;
    if (parent) {
        cursorCanvas.width = parent.clientWidth;
        cursorCanvas.height = parent.clientHeight;
        canvasManager.resize();
        redrawAll();
    }
}
window.addEventListener('resize', resizeCursorCanvas);
// Call after layout init
setTimeout(resizeCursorCanvas, 100);

// UI Elements
const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
const eraserBtn = document.getElementById('eraserBtn') as HTMLButtonElement;
const lineWidth = document.getElementById('lineWidth') as HTMLInputElement;
const undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
const redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const statusEl = document.getElementById('status')!;
const userListEl = document.getElementById('user-list')!;
const fpsEl = document.getElementById('fps')!;
const pingEl = document.getElementById('ping')!;
const roomInput = document.getElementById('roomInput') as HTMLInputElement;
const joinRoomBtn = document.getElementById('joinRoomBtn') as HTMLButtonElement;
const currentRoomEl = document.getElementById('currentRoom')!;

// State
const remoteStrokes: Record<string, { id?: string; points: { x: number, y: number }[], color: string, width: number }> = {};
const remoteCursors: Record<string, { x: number, y: number, color: string }> = {};
let localHistory: any[] = []; // Sync with server

// Performance Metrics
let fps = 0;
let frameCount = 0;
let lastFpsUpdate = performance.now();
let ping = 0;

// --- Application Logic ---
socketService.connect();

// Events
socketService.on('connect', () => {
    statusEl.textContent = 'Connected';
});

socketService.on('disconnect', () => {
    statusEl.textContent = 'Disconnected';
});

socketService.on('pong', (data: { timestamp: number }) => {
    ping = Math.round(performance.now() - data.timestamp);
    pingEl.textContent = `Ping: ${ping}ms`;
});

socketService.on('room-joined', (data: { roomId: string }) => {
    currentRoomEl.textContent = `Current: ${data.roomId}`;
    // Don't clear history here - the 'history' event from server will update it properly
});

socketService.on('history', (history: any[]) => {
    localHistory = history;
    redrawAll();
});

socketService.on('start-stroke', (data: any) => {
    remoteStrokes[data.userId] = {
        points: [{ x: data.x, y: data.y }],
        color: data.color,
        width: data.width
    };
    // Draw initial dot
    canvasManager.renderPoints([{ x: data.x, y: data.y }], data.color, data.width);
});

socketService.on('draw-point', (data: any) => {
    const stroke = remoteStrokes[data.userId];
    if (stroke) {
        stroke.points.push({ x: data.x, y: data.y });
        canvasManager.renderPoints(stroke.points, stroke.color, stroke.width);
    }

    // Update cursor
    remoteCursors[data.userId] = { x: data.x, y: data.y, color: stroke?.color || '#000' };
    renderCursors();
});

socketService.on('end-stroke', (data: any) => {
    const stroke = remoteStrokes[data.userId];
    if (stroke) {
        stroke.id = 'remote-' + Date.now();
        localHistory.push(stroke);
        delete remoteStrokes[data.userId];
    }
});

socketService.on('undo-op', () => {
    if (localHistory.length > 0) {
        localHistory.pop();
        redrawAll();
    }
});

// Added Redo Listener
socketService.on('redo-op', (stroke: any) => {
    localHistory.push(stroke);
    redrawAll();
});

socketService.on('clear', () => {
    localHistory = [];
    redrawAll();
});

socketService.on('update-users', (users: { id: string, color: string }[]) => {
    userListEl.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.marginBottom = '5px';

        const colorBox = document.createElement('div');
        colorBox.style.width = '15px';
        colorBox.style.height = '15px';
        colorBox.style.backgroundColor = user.color;
        colorBox.style.borderRadius = '50%';
        colorBox.style.marginRight = '8px';

        const text = document.createElement('span');
        text.textContent = user.id === socketService.id ? `${user.id.substring(0, 4)} (You)` : user.id.substring(0, 4);
        text.style.fontWeight = user.id === socketService.id ? 'bold' : 'normal';

        li.appendChild(colorBox);
        li.appendChild(text);
        userListEl.appendChild(li);
    });
});

function redrawAll() {
    canvasManager.clear();
    localHistory.forEach(stroke => {
        canvasManager.drawStroke(stroke);
    });
    // Re-draw active remote strokes
    Object.values(remoteStrokes).forEach(stroke => {
        canvasManager.renderPoints(stroke.points, stroke.color, stroke.width);
    });
}

// Cursor Rendering Loop
function renderCursors() {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    Object.entries(remoteCursors).forEach(([id, cursor]) => {
        cursorCtx.beginPath();
        cursorCtx.arc(cursor.x, cursor.y, 5, 0, Math.PI * 2);
        cursorCtx.fillStyle = cursor.color;
        cursorCtx.fill();
        // Label
        cursorCtx.fillStyle = '#000';
        cursorCtx.font = '10px sans-serif';
        cursorCtx.fillText(id.substring(0, 4), cursor.x + 8, cursor.y);
    });
}

function loopCursors() {
    renderCursors();

    // Track FPS
    frameCount++;
    const now = performance.now();
    if (now - lastFpsUpdate >= 1000) {
        fps = Math.round(frameCount * 1000 / (now - lastFpsUpdate));
        fpsEl.textContent = `FPS: ${fps}`;
        frameCount = 0;
        lastFpsUpdate = now;
    }

    requestAnimationFrame(loopCursors);
}
loopCursors();

// Ping measurement
function measurePing() {
    const startTime = performance.now();
    socketService.emit('ping', { timestamp: startTime });
}

setInterval(measurePing, 2000); // Measure every 2 seconds


// --- Input Handling ---
const canvasEl = document.getElementById('drawing-canvas') as HTMLCanvasElement;

function getCoordinates(e: MouseEvent | TouchEvent) {
    const rect = canvasEl.getBoundingClientRect();
    let x, y;
    if (e instanceof MouseEvent) {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
    } else {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
    }
    return { x, y };
}

canvasEl.addEventListener('mousedown', (e) => {
    const { x, y } = getCoordinates(e);
    canvasManager.startDrawing(x, y);

    const id = socketService.id + '-' + Date.now();
    socketService.emit('start-stroke', {
        id, x, y,
        color: canvasManager.color,
        width: canvasManager.width
    });
});

canvasEl.addEventListener('mousemove', (e) => {
    const { x, y } = getCoordinates(e);
    if (e.buttons === 1) {
        canvasManager.draw(x, y);
        socketService.emit('draw-point', { x, y });
    }
});

window.addEventListener('mouseup', () => {
    const stroke = canvasManager.endDrawing();
    if (stroke) {
        socketService.emit('end-stroke');
        localHistory.push(stroke);
    }
});

// Touch Events
canvasEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    canvasManager.startDrawing(x, y);
    const id = socketService.id + '-' + Date.now();
    socketService.emit('start-stroke', {
        id, x, y,
        color: canvasManager.color,
        width: canvasManager.width
    });
});

canvasEl.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    canvasManager.draw(x, y);
    socketService.emit('draw-point', { x, y });
});

window.addEventListener('touchend', () => {
    const stroke = canvasManager.endDrawing();
    if (stroke) {
        socketService.emit('end-stroke');
        localHistory.push(stroke);
    }
});

// Toolbar
let lastColor = '#000000';

colorPicker.addEventListener('input', (e) => {
    lastColor = (e.target as HTMLInputElement).value;
    canvasManager.color = lastColor;
    eraserBtn.style.background = '';
});

colorPicker.addEventListener('click', () => {
    canvasManager.color = lastColor;
    eraserBtn.style.background = '';
});

eraserBtn.addEventListener('click', () => {
    lastColor = canvasManager.color !== '#ffffff' ? canvasManager.color : lastColor;
    canvasManager.color = '#ffffff';
    eraserBtn.style.background = '#ccc';
});

lineWidth.addEventListener('input', (e) => {
    canvasManager.width = parseInt((e.target as HTMLInputElement).value);
});

clearBtn.addEventListener('click', () => {
    socketService.emit('clear');
});

undoBtn.addEventListener('click', () => {
    socketService.emit('undo');
});

redoBtn.addEventListener('click', () => {
    socketService.emit('redo');
});

// Room Management
joinRoomBtn.addEventListener('click', () => {
    const roomId = roomInput.value.trim() || 'default';
    socketService.emit('join-room', { roomId });
});

