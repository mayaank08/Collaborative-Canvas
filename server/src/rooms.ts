export interface User {
    id: string;
    color: string;
    roomId: string;
}

interface Room {
    id: string;
    users: Record<string, User>;
}

export class RoomManager {
    private rooms: Record<string, Room> = {};

    constructor() {
        // Create default room
        this.createRoom('default');
    }

    private getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    public createRoom(roomId: string) {
        if (!this.rooms[roomId]) {
            this.rooms[roomId] = {
                id: roomId,
                users: {}
            };
        }
        return this.rooms[roomId];
    }

    public addUser(userId: string, roomId: string = 'default') {
        // Ensure room exists
        if (!this.rooms[roomId]) {
            this.createRoom(roomId);
        }

        const user: User = {
            id: userId,
            color: this.getRandomColor(),
            roomId
        };

        this.rooms[roomId].users[userId] = user;
        return user;
    }

    public removeUser(userId: string, roomId: string) {
        if (this.rooms[roomId] && this.rooms[roomId].users[userId]) {
            delete this.rooms[roomId].users[userId];
        }
    }

    public getUser(userId: string, roomId: string) {
        return this.rooms[roomId]?.users[userId];
    }

    public getRoomUsers(roomId: string) {
        return this.rooms[roomId] ? Object.values(this.rooms[roomId].users) : [];
    }

    public getAllRooms() {
        return Object.keys(this.rooms);
    }

    public getRoomSize(roomId: string) {
        return this.rooms[roomId] ? Object.keys(this.rooms[roomId].users).length : 0;
    }
}
