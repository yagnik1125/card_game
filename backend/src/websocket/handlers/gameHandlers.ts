import { Server, Socket } from "socket.io";
import { GameSession } from "../../../game-engine/src/session/GameSession.js";
import { GameSessionManager } from "../../../game-engine/src/session/GameSessionManager.js";
import { GameService } from "../../services/GameService.js";
import { InFlightGuard } from "../../services/InFlightGuard.js";
import { TurnScheduler } from "../../services/TurnScheduler.js";
import { ConnectionStore } from "../ConnectionStore.js";
import { GameEventEmitter } from "../GameEventEmitter.js";
import {
    isGameCreatePayload,
    isGameIdPayload,
    isGamePlayerPayload,
    isGamePlayCardPayload,
} from "../protocol/guards.js";
import { errorAck, okAck, WsAck } from "../protocol/responses.js";
import type {
    GameErrorPayload,
    GameLeftPayload,
} from "../protocol/serverEvents.js";

type AckFn = (response: WsAck<unknown>) => void;

function resolveAck(ack: unknown): AckFn | undefined {
    return typeof ack === "function" ? (ack as AckFn) : undefined;
}

export interface SocketHandlerContext {
    io: Server;
    socket: Socket;
}

function assertBoundPlayer(
    ctx: SocketHandlerContext,
    gameId: string,
    playerId: string,
    ack?: AckFn
): boolean {
    const connection = ConnectionStore.get(ctx.socket.id);
    if (!connection || connection.gameId !== gameId || connection.playerId !== playerId) {
        ack?.(errorAck("UNAUTHORIZED", "Socket is not bound to this player", gameId));
        return false;
    }
    return true;
}

function gameExists(gameId: string): boolean {
    try {
        GameSessionManager.get(gameId);
        return true;
    } catch {
        return false;
    }
}

function pushGameNotFound(
    ctx: SocketHandlerContext,
    gameId: string,
    ack?: AckFn
): void {
    const err: GameErrorPayload = {
        code: "GAME_NOT_FOUND",
        message: "Game not found",
        gameId,
    };
    pushGameError(ctx, err);
    ack?.(errorAck(err.code, err.message, gameId));
}

function moveSocketToGame(
    ctx: SocketHandlerContext,
    gameId: string,
    playerId: string
): void {
    const existing = ConnectionStore.get(ctx.socket.id);
    if (existing && existing.gameId !== gameId) {
        ctx.socket.leave(existing.gameId);
        ConnectionStore.remove(ctx.socket.id);
        const payload: GameLeftPayload = {
            gameId: existing.gameId,
            playerId: existing.playerId,
            socketId: ctx.socket.id,
        };
        ctx.io.to(existing.gameId).emit("GAME_LEFT", payload);
    }
    ctx.socket.join(gameId);
    ConnectionStore.add({
        socketId: ctx.socket.id,
        gameId,
        playerId,
    });
}

function pushGameError(
    ctx: SocketHandlerContext,
    payload: GameErrorPayload
): void {
    ctx.socket.emit("GAME_ERROR", payload);
}

function mapError(
    gameId: string | undefined,
    error: unknown
): GameErrorPayload {
    const message = error instanceof Error ? error.message : "Unknown error";
    let code = "INTERNAL_ERROR";
    if (message === "Game not found") {
        code = "GAME_NOT_FOUND";
    } else if (message === "Player not found") {
        code = "PLAYER_NOT_FOUND";
    } else if (message === "Card not found") {
        code = "CARD_NOT_FOUND";
    } else if (message === "Illegal move" || message === "Invalid move") {
        code = "ILLEGAL_MOVE";
    } else if (message === "Not your turn") {
        code = "NOT_YOUR_TURN";
    } else if (message === "Game not initialized") {
        code = "GAME_NOT_INITIALIZED";
    }
    return { code, message, gameId };
}

export function handleCreateGame(
    ctx: SocketHandlerContext,
    payload: unknown,
    rawAck?: unknown
): void {
    const ack = resolveAck(rawAck);

    if (!isGameCreatePayload(payload)) {
        ack?.(errorAck("BAD_PAYLOAD", "Invalid GAME:CREATE payload"));
        return;
    }

    try {
        const session = GameService.createGame(
            payload.numberOfRounds,
            payload.difficulty,
            payload.mode
        );
        moveSocketToGame(ctx, session.gameId, "P1");
        GameEventEmitter.gameCreated(session.gameId);
        ack?.(okAck({
            gameId: session.gameId,
            snapshot: GameService.getView(session.gameId),
        }));
    } catch (error) {
        const err = mapError(undefined, error);
        ack?.(errorAck(err.code, err.message));
    }
}

export function handlePlayCard(
    ctx: SocketHandlerContext,
    payload: unknown,
    rawAck?: unknown
): void {
    const ack = resolveAck(rawAck);

    if (!isGamePlayCardPayload(payload)) {
        ack?.(errorAck("BAD_PAYLOAD", "Invalid GAME:PLAY_CARD payload"));
        return;
    }

    const { gameId, playerId, cardId } = payload;

    let session: GameSession | undefined;
    try {
        session = GameSessionManager.get(gameId);
    } catch {
        session = undefined;
    }
    if (!session) {
        pushGameNotFound(ctx, gameId, ack);
        return;
    }
    const targetPlayer = session.match.players.find((p) => p.id === playerId);
    if (!targetPlayer) {
        ack?.(errorAck("PLAYER_NOT_FOUND", "Player not found", gameId));
        return;
    }
    if (targetPlayer.isBot) {
        ack?.(errorAck("BOT_PLAYER", "Bot players cannot be controlled over the socket", gameId));
        return;
    }
    const existing = ConnectionStore.get(ctx.socket.id);
    const alreadyBound =
        existing && existing.gameId === gameId && existing.playerId === playerId;
    if (!alreadyBound) {
        const controlled = ConnectionStore.getAll().some(
            (c) => c.gameId === gameId && c.playerId === playerId
        );
        if (controlled) {
            ack?.(errorAck("UNAUTHORIZED", "Socket is not bound to this player", gameId));
            return;
        }
        if (existing && existing.gameId !== gameId) {
            ctx.socket.leave(existing.gameId);
            ConnectionStore.remove(ctx.socket.id);
        }
        ctx.socket.join(gameId);
        ConnectionStore.add({
            socketId: ctx.socket.id,
            gameId,
            playerId,
        });
    }

    if (!InFlightGuard.tryAcquire(gameId)) {
        ack?.(errorAck("GAME_BUSY", "Game is busy processing another play", gameId));
        return;
    }

    try {
        const result = TurnScheduler.playerPlay(gameId, playerId, cardId);
        ack?.(okAck({
            events: result.events,
            snapshot: result.snapshot,
        }));
    } catch (error) {
        InFlightGuard.release(gameId);
        const err = mapError(gameId, error);
        pushGameError(ctx, err);
        ack?.(errorAck(err.code, err.message, gameId));
    }
}

export function handleGetState(
    ctx: SocketHandlerContext,
    payload: unknown,
    rawAck?: unknown
): void {
    const ack = resolveAck(rawAck);

    if (!isGameIdPayload(payload)) {
        ack?.(errorAck("BAD_PAYLOAD", "Invalid GAME:GET_STATE payload"));
        return;
    }

    try {
        ack?.(okAck(GameService.getGameState(payload.gameId)));
    } catch (error) {
        const err = mapError(payload.gameId, error);
        pushGameError(ctx, err);
        ack?.(errorAck(err.code, err.message, payload.gameId));
    }
}

export function handleGetTurn(
    ctx: SocketHandlerContext,
    payload: unknown,
    rawAck?: unknown
): void {
    const ack = resolveAck(rawAck);

    if (!isGameIdPayload(payload)) {
        ack?.(errorAck("BAD_PAYLOAD", "Invalid GAME:GET_TURN payload"));
        return;
    }

    try {
        ack?.(okAck(GameService.getTurn(payload.gameId)));
    } catch (error) {
        const err = mapError(payload.gameId, error);
        pushGameError(ctx, err);
        ack?.(errorAck(err.code, err.message, payload.gameId));
    }
}

export function handleGetLegalMoves(
    ctx: SocketHandlerContext,
    payload: unknown,
    rawAck?: unknown
): void {
    const ack = resolveAck(rawAck);

    if (!isGamePlayerPayload(payload)) {
        ack?.(errorAck("BAD_PAYLOAD", "Invalid GAME:GET_LEGAL_MOVES payload"));
        return;
    }

    if (!gameExists(payload.gameId)) {
        pushGameNotFound(ctx, payload.gameId, ack);
        return;
    }

    if (!assertBoundPlayer(ctx, payload.gameId, payload.playerId, ack)) {
        return;
    }

    try {
        ack?.(okAck(GameService.getLegalMoves(payload.gameId, payload.playerId)));
    } catch (error) {
        const err = mapError(payload.gameId, error);
        pushGameError(ctx, err);
        ack?.(errorAck(err.code, err.message, payload.gameId));
    }
}

export function handleGetHand(
    ctx: SocketHandlerContext,
    payload: unknown,
    rawAck?: unknown
): void {
    const ack = resolveAck(rawAck);

    if (!isGamePlayerPayload(payload)) {
        ack?.(errorAck("BAD_PAYLOAD", "Invalid GAME:GET_HAND payload"));
        return;
    }

    if (!gameExists(payload.gameId)) {
        pushGameNotFound(ctx, payload.gameId, ack);
        return;
    }

    if (!assertBoundPlayer(ctx, payload.gameId, payload.playerId, ack)) {
        return;
    }

    try {
        ack?.(okAck(GameService.getPlayerHand(payload.gameId, payload.playerId)));
    } catch (error) {
        const err = mapError(payload.gameId, error);
        pushGameError(ctx, err);
        ack?.(errorAck(err.code, err.message, payload.gameId));
    }
}

export function handleRemoveGame(
    ctx: SocketHandlerContext,
    payload: unknown,
    rawAck?: unknown
): void {
    const ack = resolveAck(rawAck);

    if (!isGameIdPayload(payload)) {
        ack?.(errorAck("BAD_PAYLOAD", "Invalid GAME:REMOVE payload"));
        return;
    }

    let session: GameSession | undefined;
    try {
        session = GameSessionManager.get(payload.gameId);
    } catch {
        session = undefined;
    }
    if (!session) {
        const err: GameErrorPayload = {
            code: "GAME_NOT_FOUND",
            message: "Game not found",
            gameId: payload.gameId,
        };
        pushGameError(ctx, err);
        ack?.(errorAck(err.code, err.message, payload.gameId));
        return;
    }

    const connection = ConnectionStore.get(ctx.socket.id);
    if (
        !connection ||
        connection.gameId !== payload.gameId ||
        connection.playerId !== "P1"
    ) {
        ack?.(errorAck(
            "UNAUTHORIZED",
            "Only the game owner can remove the game",
            payload.gameId
        ));
        return;
    }

    GameSessionManager.remove(payload.gameId);
    ConnectionStore.getAll().forEach((connection) => {
        if (connection.gameId === payload.gameId) {
            ConnectionStore.remove(connection.socketId);
        }
    });
    GameEventEmitter.gameRemoved(payload.gameId);
    ack?.(okAck(null));
}

export function registerGameHandlers(io: Server): void {
    io.on("connection", (socket: Socket) => {
        socket.on("GAME:CREATE", (payload: unknown, rawAck?: unknown) => {
            handleCreateGame({ io, socket }, payload, rawAck);
        });
        socket.on("GAME:PLAY_CARD", (payload: unknown, rawAck?: unknown) => {
            handlePlayCard({ io, socket }, payload, rawAck);
        });
        socket.on("GAME:GET_STATE", (payload: unknown, rawAck?: unknown) => {
            handleGetState({ io, socket }, payload, rawAck);
        });
        socket.on("GAME:GET_TURN", (payload: unknown, rawAck?: unknown) => {
            handleGetTurn({ io, socket }, payload, rawAck);
        });
        socket.on("GAME:GET_LEGAL_MOVES", (payload: unknown, rawAck?: unknown) => {
            handleGetLegalMoves({ io, socket }, payload, rawAck);
        });
        socket.on("GAME:GET_HAND", (payload: unknown, rawAck?: unknown) => {
            handleGetHand({ io, socket }, payload, rawAck);
        });
        socket.on("GAME:REMOVE", (payload: unknown, rawAck?: unknown) => {
            handleRemoveGame({ io, socket }, payload, rawAck);
        });
    });
}
