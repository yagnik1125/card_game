import { Server, Socket } from "socket.io";
import { GameSession } from "../../game-engine/src/session/GameSession.js";
import { GameSessionManager } from "../../game-engine/src/session/GameSessionManager.js";
import { ConnectionStore } from "./ConnectionStore.js";
import { GameEventEmitter } from "./GameEventEmitter.js";
import { wsLog } from "./wsLogger.js";
import { CLIENT_COMMAND_NAMES } from "./protocol/clientEvents.js";
import { isGameIdPayload, isGameJoinPayload } from "./protocol/guards.js";
import { errorAck, okAck, WsAck } from "./protocol/responses.js";
import type { GameErrorPayload, GameLeftPayload } from "./protocol/serverEvents.js";

type AckFn = (response: WsAck<unknown>) => void;

const KNOWN_CLIENT_EVENTS: ReadonlySet<string> = new Set(CLIENT_COMMAND_NAMES);

function resolveAck(ack: unknown): AckFn | undefined {
    return typeof ack === "function" ? ack as AckFn : undefined;
}

function notifyGameLeft(io: Server, gameId: string, playerId: string | undefined, socketId: string): void {
    const payload: GameLeftPayload = { gameId, playerId, socketId };
    io.to(gameId).emit("GAME_LEFT", payload);
}

export function registerSocketHandlers(io: Server): void {
    io.on("connection", (socket: Socket) => {
        wsLog(`socket connected id=${socket.id}`);

        socket.on("GAME:PING", (...args: unknown[]) => {
            const ack = resolveAck(args[args.length - 1]);
            ack?.(okAck(null));
        });

        socket.onAny((event: string, ...args: unknown[]) => {
            if (KNOWN_CLIENT_EVENTS.has(event)) {
                return;
            }
            const ack = resolveAck(args[args.length - 1]);
            const errorPayload: GameErrorPayload = {
                code: "UNKNOWN_EVENT",
                message: `Unknown event: ${event}`,
            };
            socket.emit("GAME_ERROR", errorPayload);
            ack?.(errorAck(errorPayload.code, errorPayload.message));
        });

        socket.on("GAME:JOIN", (payload: unknown, rawAck?: unknown) => {
            const ack = resolveAck(rawAck);

            if (!isGameJoinPayload(payload)) {
                ack?.(errorAck("BAD_PAYLOAD", "Invalid GAME:JOIN payload"));
                return;
            }

            let session: GameSession | undefined;
            try {
                session = GameSessionManager.get(payload.gameId);
            } catch {
                session = undefined;
            }
            if (!session) {
                const errorPayload: GameErrorPayload = {
                    code: "GAME_NOT_FOUND",
                    message: "Game not found",
                    gameId: payload.gameId,
                };
                ack?.(errorAck(errorPayload.code, errorPayload.message, errorPayload.gameId));
                socket.emit("GAME_ERROR", errorPayload);
                return;
            }

            const isPlayer = session.match.players.some(
                (player) => player.id === payload.playerId
            );
            if (!isPlayer) {
                ack?.(errorAck("PLAYER_NOT_FOUND", "Player is not part of this game", payload.gameId));
                return;
            }

            const existing = ConnectionStore.get(socket.id);
            if (existing && existing.gameId !== payload.gameId) {
                socket.leave(existing.gameId);
                ConnectionStore.remove(socket.id);
                notifyGameLeft(io, existing.gameId, existing.playerId, socket.id);
            }

            socket.join(payload.gameId);
            ConnectionStore.add({
                socketId: socket.id,
                gameId: payload.gameId,
                playerId: payload.playerId,
            });
            wsLog(
                `GAME:JOIN socket=${socket.id} game=${payload.gameId} player=${payload.playerId}`
            );
            io.to(payload.gameId).emit("GAME_JOINED", {
                gameId: payload.gameId,
                playerId: payload.playerId,
                socketId: socket.id,
            });
            GameEventEmitter.gameState(payload.gameId);
            ack?.(okAck({ gameId: payload.gameId }));
        });

        socket.on("GAME:LEAVE", (payload: unknown, rawAck?: unknown) => {
            const ack = resolveAck(rawAck);

            if (!isGameIdPayload(payload)) {
                ack?.(errorAck("BAD_PAYLOAD", "Invalid GAME:LEAVE payload"));
                return;
            }

            const existing = ConnectionStore.get(socket.id);
            socket.leave(payload.gameId);
            if (existing && existing.gameId === payload.gameId) {
                ConnectionStore.remove(socket.id);
                notifyGameLeft(io, payload.gameId, existing.playerId, socket.id);
            }
            wsLog(
                `GAME:LEAVE socket=${socket.id} game=${payload.gameId} player=${existing?.playerId ?? "?"}`
            );
            ack?.(okAck(null));
        });

        socket.on("disconnect", () => {
            const existing = ConnectionStore.remove(socket.id);
            if (existing) {
                notifyGameLeft(io, existing.gameId, existing.playerId, socket.id);
                wsLog(
                    `socket disconnected id=${socket.id} game=${existing.gameId} player=${existing.playerId}`
                );
            } else {
                wsLog(`socket disconnected id=${socket.id} (no game bound)`);
            }
        });
    });
}
