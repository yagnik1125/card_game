import { Server } from "socket.io";

export class GameGateway {
    private static io: Server;

    static initialize(io: Server) {
        this.io = io;
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
    ) {
        const socket =this.io.sockets.sockets.get(socketId);
        socket?.join(gameId);
    }

    static emitToGame(
        gameId: string,
        event: string,
        payload: any
    ) {
        this.io.to(gameId).emit(
            event,
            payload
        );
    }
}