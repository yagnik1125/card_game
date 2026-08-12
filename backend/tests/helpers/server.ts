import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createGameServer } from "../../src/websocket/createGameServer.js";
import { SessionStore } from "../../game-engine/src/session/SessionStore.js";

export interface TestServer {
    httpServer: http.Server;
    io: SocketIOServer;
    port: number;
    url: string;
    close: () => Promise<void>;
}

export async function startTestServer(): Promise<TestServer> {
    const { httpServer, io } = createGameServer();

    await new Promise<void>((resolve) => {
        httpServer.listen(0, resolve);
    });

    const address = httpServer.address();
    const port = typeof address === "object" && address !== null ? address.port : 0;

    return {
        httpServer,
        io,
        port,
        url: `http://localhost:${port}`,
        close: () =>
            new Promise<void>((resolve) => {
                io.close();
                httpServer.close(() => resolve());
            }),
    };
}

export function resetSessionStore(): void {
    SessionStore.getAll().forEach((session) => {
        SessionStore.remove(session.gameId);
    });
}
