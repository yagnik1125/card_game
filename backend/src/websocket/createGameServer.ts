import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "../app.js";
import { ALLOWED_CORS_ORIGINS } from "../config.js";
import { GameGateway } from "./GameGateway.js";
import { GameEventBridge } from "./GameEventBridge.js";
import { registerSocketHandlers } from "./socketHandlers.js";
import { registerGameHandlers } from "./handlers/gameHandlers.js";

export interface GameServer {
    httpServer: http.Server;
    io: SocketIOServer;
}

export function createGameServer(): GameServer {
    const httpServer: http.Server = http.createServer(app);
    const io: SocketIOServer = new SocketIOServer(httpServer, {
        cors: {
            origin: ALLOWED_CORS_ORIGINS
        }
    });
    GameGateway.initialize(io);
    GameEventBridge.start();
    registerSocketHandlers(io);
    registerGameHandlers(io);
    return { httpServer, io };
}
