import { io, Socket } from 'socket.io-client';

export class SocketService {
    private socket: Socket;

    constructor(url: string = 'http://localhost:3000') {
        this.socket = io(url);
    }

    public on(event: string, callback: (...args: any[]) => void) {
        this.socket.on(event, callback);
    }

    public emit(event: string, data?: any) {
        this.socket.emit(event, data);
    }

    public get id() {
        return this.socket.id;
    }

    public connect() {
        if (!this.socket.connected) {
            this.socket.connect();
        }
    }
}
