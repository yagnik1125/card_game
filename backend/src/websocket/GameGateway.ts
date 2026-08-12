import { Server } from "socket.io";

export class GameGateway {
    private static io: Server | undefined;

    static initialize(io: Server): void {
        this.io = io;
    }

    static uninitialize(): void {
        this.io = undefined;
    }

    static hasSocketServer(): boolean {
        return this.io !== undefined;
    }

    static getIO(): Server {
        if (!this.io) {
            throw new Error(
                "Socket server not initialized"
            );
        }
        return this.io;
    }

    static joinGame(
        socketId: string,
        gameId: string
    ): void {
        if (!this.io) {
            return;
        }
        const socket = this.io.sockets.sockets.get(socketId);
        socket?.join(gameId);
    }

    static emitToGame(
        gameId: string,
        event: string,
        payload: unknown
    ): void {
        if (!this.io) {
            return;
        }
        this.io.to(gameId).emit(
            event,
            payload
        );
    }

    static hasRoomMembers(gameId: string): boolean {
        if (!this.io) {
            return false;
        }
        const adapter = this.io.sockets?.adapter;
        if (!adapter) {
            return true;
        }
        return (adapter.rooms?.get(gameId)?.size ?? 0) > 0;
    }
}
