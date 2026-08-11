export interface SocketConnection {
    socketId: string;
    gameId: string;
    playerId: string;
}

export class ConnectionStore {
    private static connections: Map<string, SocketConnection> = new Map();

    static add(connection: SocketConnection): void {
        this.connections.set(connection.socketId, connection);
    }

    static get(socketId: string): SocketConnection | undefined {
        return this.connections.get(socketId);
    }

    static remove(socketId: string): SocketConnection | undefined {
        const existing = this.connections.get(socketId);
        this.connections.delete(socketId);
        return existing;
    }

    static getAll(): SocketConnection[] {
        return Array.from(this.connections.values());
    }

    static clear(): void {
        this.connections.clear();
    }
}
