import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { DrawingState } from './drawing-state';
import { RoomManager } from './rooms';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;

// Initialize Managers
const roomManager = new RoomManager();
const roomStates: Record<string, DrawingState> = {
    'default': new DrawingState()
};

// Helper to get or create room state
function getRoomState(roomId: string): DrawingState {
    if (!roomStates[roomId]) {
        roomStates[roomId] = new DrawingState();
    }
    return roomStates[roomId];
}

// Track user rooms
const userRooms: Record<string, string> = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Default to 'default' room
    const defaultRoom = 'default';
    userRooms[socket.id] = defaultRoom;
    socket.join(defaultRoom);

    // Add user to room
    roomManager.addUser(socket.id, defaultRoom);
    const drawingState = getRoomState(defaultRoom);

    // Send initial state
    socket.emit('history', drawingState.getHistory());
    io.to(defaultRoom).emit('update-users', roomManager.getRoomUsers(defaultRoom));

    // --- Room Management ---
    socket.on('join-room', (data: { roomId: string }) => {
        const newRoomId = data.roomId || 'default';
        const oldRoomId = userRooms[socket.id];

        // Leave old room
        if (oldRoomId) {
            socket.leave(oldRoomId);
            roomManager.removeUser(socket.id, oldRoomId);
            getRoomState(oldRoomId).removeUser(socket.id);
            io.to(oldRoomId).emit('update-users', roomManager.getRoomUsers(oldRoomId));
        }

        // Join new room
        socket.join(newRoomId);
        userRooms[socket.id] = newRoomId;
        roomManager.addUser(socket.id, newRoomId);

        const newRoomState = getRoomState(newRoomId);
        socket.emit('history', newRoomState.getHistory());
        io.to(newRoomId).emit('update-users', roomManager.getRoomUsers(newRoomId));
        socket.emit('room-joined', { roomId: newRoomId });
    });

    // --- Drawing Events ---
    socket.on('start-stroke', (data: { id: string, x: number, y: number, color: string, width: number }) => {
        const roomId = userRooms[socket.id];
        const drawingState = getRoomState(roomId);
        drawingState.startStroke(socket.id, data.id, data.x, data.y, data.color, data.width);
        socket.to(roomId).emit('start-stroke', { ...data, userId: socket.id });
    });

    socket.on('draw-point', (data: { x: number, y: number }) => {
        const roomId = userRooms[socket.id];
        const stroke = getRoomState(roomId).addPoint(socket.id, data.x, data.y);
        if (stroke) {
            socket.to(roomId).emit('draw-point', { userId: socket.id, x: data.x, y: data.y });
        }
    });

    socket.on('end-stroke', () => {
        const roomId = userRooms[socket.id];
        const stroke = getRoomState(roomId).endStroke(socket.id);
        if (stroke) {
            socket.to(roomId).emit('end-stroke', { userId: socket.id });
        }
    });

    // --- History Events ---
    socket.on('undo', () => {
        const roomId = userRooms[socket.id];
        const removed = getRoomState(roomId).undo();
        if (removed) {
            io.to(roomId).emit('undo-op', { id: removed.id });
        }
    });

    socket.on('redo', () => {
        const roomId = userRooms[socket.id];
        const restored = getRoomState(roomId).redo();
        if (restored) {
            io.to(roomId).emit('redo-op', restored);
        }
    });

    socket.on('clear', () => {
        const roomId = userRooms[socket.id];
        getRoomState(roomId).clear();
        io.to(roomId).emit('clear');
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const roomId = userRooms[socket.id];
        if (roomId) {
            getRoomState(roomId).removeUser(socket.id);
            roomManager.removeUser(socket.id, roomId);
            io.to(roomId).emit('update-users', roomManager.getRoomUsers(roomId));
        }
        delete userRooms[socket.id];
    });

    // --- Performance ---
    socket.on('ping', (data: { timestamp: number }) => {
        socket.emit('pong', data);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
