import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Server, Socket } from "socket.io";
import { GameSessionManager } from "../../../../game-engine/src/session/GameSessionManager.js";
import { SessionStore } from "../../../../game-engine/src/session/SessionStore.js";
import { GameService } from "../../../../src/services/GameService.js";
import { InFlightGuard } from "../../../../src/services/InFlightGuard.js";
import { ConnectionStore } from "../../../../src/websocket/ConnectionStore.js";
import { GameGateway } from "../../../../src/websocket/GameGateway.js";
import {
    handleCreateGame,
    handleGetHand,
    handleGetLegalMoves,
    handleGetState,
    handleGetTurn,
    handlePlayCard,
    handleRemoveGame,
    SocketHandlerContext,
} from "../../../../src/websocket/handlers/gameHandlers.js";

function makeMocks() {
    const roomEmit = vi.fn();
    const io = { to: vi.fn(() => ({ emit: roomEmit })) };
    const socket = {
        id: "s1",
        join: vi.fn(),
        leave: vi.fn(),
        emit: vi.fn(),
    };
    const ctx: SocketHandlerContext = {
        io: io as unknown as Server,
        socket: socket as unknown as Socket,
    };
    const ack = vi.fn();
    return { io, socket, roomEmit, ctx, ack };
}

function lastAck(ack: ReturnType<typeof vi.fn>): any {
    return ack.mock.calls[ack.mock.calls.length - 1][0];
}

function createGameViaHandler(
    ctx: SocketHandlerContext,
    ack: ReturnType<typeof vi.fn>
): string {
    handleCreateGame(
        ctx,
        { numberOfRounds: 1, difficulty: "easy", mode: "SOLO" },
        ack
    );
    const res = lastAck(ack);
    expect(res.ok).toBe(true);
    return res.data.gameId;
}

describe("gameHandlers", () => {
    beforeEach(() => {
        GameGateway.uninitialize();
        ConnectionStore.clear();
        InFlightGuard.clear();
        SessionStore.getAll().forEach((session) =>
            SessionStore.remove(session.gameId)
        );
    });

    afterEach(() => {
        GameGateway.uninitialize();
        ConnectionStore.clear();
        InFlightGuard.clear();
        SessionStore.getAll().forEach((session) =>
            SessionStore.remove(session.gameId)
        );
    });

    describe("GAME:CREATE", () => {
        it("creates a game, joins the creator, emits GAME_CREATED, and acks gameId + snapshot", () => {
            const { io, socket, roomEmit, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);

            handleCreateGame(
                ctx,
                { numberOfRounds: 2, difficulty: "hard", mode: "SOLO" },
                ack
            );

            const res = lastAck(ack);
            expect(res.ok).toBe(true);
            expect(res.data.gameId).toBeTruthy();
            expect(res.data.snapshot.roundNumber).toBe(1);
            expect(socket.join).toHaveBeenCalledWith(res.data.gameId);
            expect(ConnectionStore.get("s1")).toEqual({
                socketId: "s1",
                gameId: res.data.gameId,
                playerId: "P1",
            });
            expect(roomEmit).toHaveBeenCalledWith(
                "GAME_CREATED",
                expect.objectContaining({
                    type: "GAME_CREATED",
                    payload: { gameId: res.data.gameId },
                    timestamp: expect.any(Number),
                })
            );
            expect(GameSessionManager.get(res.data.gameId)).toBeDefined();
        });

        it("moves the creator socket when it was already in another game", () => {
            const { io, socket, roomEmit, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            ConnectionStore.add({
                socketId: "s1",
                gameId: "old-game",
                playerId: "P1",
            });

            handleCreateGame(
                ctx,
                { numberOfRounds: 1, difficulty: "easy", mode: "SOLO" },
                ack
            );

            const gameId = lastAck(ack).data.gameId;
            expect(socket.leave).toHaveBeenCalledWith("old-game");
            expect(socket.join).toHaveBeenCalledWith(gameId);
            expect(ConnectionStore.get("s1")?.gameId).toBe(gameId);
            expect(roomEmit).toHaveBeenCalledWith(
                "GAME_LEFT",
                expect.objectContaining({ gameId: "old-game" })
            );
        });

        it("rejects an invalid payload with BAD_PAYLOAD", () => {
            const { socket, ctx, ack } = makeMocks();

            handleCreateGame(
                ctx,
                { numberOfRounds: 0, difficulty: "easy", mode: "SOLO" },
                ack
            );

            expect(lastAck(ack)).toEqual({
                ok: false,
                error: { code: "BAD_PAYLOAD", message: "Invalid GAME:CREATE payload" },
            });
            expect(socket.join).not.toHaveBeenCalled();
        });
    });

    describe("GAME:PLAY_CARD", () => {
        it("plays the card, acks the human events + snapshot, and releases the guard when the bot chain ends", () => {
            vi.useFakeTimers();
            try {
                const { io, ctx, ack } = makeMocks();
                GameGateway.initialize(io as any);
                const gameId = createGameViaHandler(ctx, ack);

                const legal = GameService.getLegalMoves(gameId, "P1");
                ack.mockClear();

                handlePlayCard(
                    ctx,
                    { gameId, playerId: "P1", cardId: legal[0].id },
                    ack
                );

                const res = lastAck(ack);
                expect(res.ok).toBe(true);
                expect(
                    res.data.events.some((e: any) => e.type === "CARD_PLAYED")
                ).toBe(true);
                expect(
                    res.data.events.some((e: any) => e.type === "BOT_PLAY")
                ).toBe(false);
                expect(res.data.snapshot.gameId).toBe(gameId);
                expect(InFlightGuard.isInFlight(gameId)).toBe(true);

                vi.advanceTimersByTime(60000);
                expect(InFlightGuard.isInFlight(gameId)).toBe(false);
            } finally {
                vi.useRealTimers();
            }
        });

        it("rejects an invalid payload with BAD_PAYLOAD", () => {
            const { ctx, ack } = makeMocks();

            handlePlayCard(ctx, { gameId: "g1" }, ack);

            expect(lastAck(ack)).toEqual({
                ok: false,
                error: { code: "BAD_PAYLOAD", message: "Invalid GAME:PLAY_CARD payload" },
            });
        });

        it("rejects an unknown game with GAME_NOT_FOUND ack and GAME_ERROR push", () => {
            const { socket, ctx, ack } = makeMocks();

            handlePlayCard(
                ctx,
                { gameId: "nope", playerId: "P1", cardId: "x" },
                ack
            );

            expect(lastAck(ack)).toEqual({
                ok: false,
                error: {
                    code: "GAME_NOT_FOUND",
                    message: "Game not found",
                    gameId: "nope",
                },
            });
            expect(socket.emit).toHaveBeenCalledWith(
                "GAME_ERROR",
                expect.objectContaining({ code: "GAME_NOT_FOUND", gameId: "nope" })
            );
        });

        it("rejects an illegal card with ILLEGAL_MOVE ack and GAME_ERROR push", () => {
            const { io, socket, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            const gameId = createGameViaHandler(ctx, ack);

            handlePlayCard(
                ctx,
                { gameId, playerId: "P1", cardId: "not-a-card" },
                ack
            );

            expect(lastAck(ack)).toEqual({
                ok: false,
                error: {
                    code: "ILLEGAL_MOVE",
                    message: "Illegal move",
                    gameId,
                },
            });
            expect(socket.emit).toHaveBeenCalledWith(
                "GAME_ERROR",
                expect.objectContaining({ code: "ILLEGAL_MOVE", gameId })
            );
        });

        it("rejects a play when it is not the player's turn", () => {
            const { io, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            const gameId = createGameViaHandler(ctx, ack);

            const session = GameSessionManager.get(gameId);
            session.gameState!.turnState.currentPlayerId = "P2";
            GameSessionManager.save(session);

            const legal = GameService.getLegalMoves(gameId, "P1");
            handlePlayCard(
                ctx,
                { gameId, playerId: "P1", cardId: legal[0].id },
                ack
            );

            expect(lastAck(ack).ok).toBe(false);
            expect(lastAck(ack).error.code).toBe("NOT_YOUR_TURN");
        });

        it("rejects a play while the game is in flight with GAME_BUSY", () => {
            const { io, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            const gameId = createGameViaHandler(ctx, ack);
            const legal = GameService.getLegalMoves(gameId, "P1");
            InFlightGuard.tryAcquire(gameId);

            handlePlayCard(
                ctx,
                { gameId, playerId: "P1", cardId: legal[0].id },
                ack
            );

            expect(lastAck(ack)).toEqual({
                ok: false,
                error: {
                    code: "GAME_BUSY",
                    message: "Game is busy processing another play",
                    gameId,
                },
            });
            InFlightGuard.release(gameId);
        });

        it("rejects a play from a second socket when the player is already bound", () => {
            const { io, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            const gameId = createGameViaHandler(ctx, ack);

            const otherSocket = {
                id: "s2",
                join: vi.fn(),
                leave: vi.fn(),
                emit: vi.fn(),
            };
            const otherCtx: SocketHandlerContext = {
                io: ctx.io,
                socket: otherSocket as unknown as Socket,
            };
            const otherAck = vi.fn();
            const legal = GameService.getLegalMoves(gameId, "P1");

            handlePlayCard(
                otherCtx,
                { gameId, playerId: "P1", cardId: legal[0].id },
                otherAck
            );

            expect(lastAck(otherAck).ok).toBe(false);
            expect(lastAck(otherAck).error.code).toBe("UNAUTHORIZED");
        });

        it("rejects a play of a bot's card with BOT_PLAYER", () => {
            const { io, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            const gameId = createGameViaHandler(ctx, ack);
            ConnectionStore.add({ socketId: "s1", gameId, playerId: "P2" });
            const legal = GameService.getLegalMoves(gameId, "P2");

            handlePlayCard(
                ctx,
                { gameId, playerId: "P2", cardId: legal[0].id },
                ack
            );

            expect(lastAck(ack).ok).toBe(false);
            expect(lastAck(ack).error.code).toBe("BOT_PLAYER");
            expect(InFlightGuard.isInFlight(gameId)).toBe(false);
        });
    });

    describe("query handlers", () => {
        it("GET_STATE acks the same data as GameService.getGameState", () => {
            const { io, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            const gameId = createGameViaHandler(ctx, ack);

            handleGetState(ctx, { gameId }, ack);

            const res = lastAck(ack);
            expect(res.ok).toBe(true);
            expect(res.data).toEqual(GameService.getGameState(gameId));
        });

        it("GET_STATE rejects an unknown game with GAME_ERROR", () => {
            const { socket, ctx, ack } = makeMocks();

            handleGetState(ctx, { gameId: "nope" }, ack);

            expect(lastAck(ack).ok).toBe(false);
            expect(lastAck(ack).error.code).toBe("GAME_NOT_FOUND");
            expect(socket.emit).toHaveBeenCalledWith(
                "GAME_ERROR",
                expect.objectContaining({ code: "GAME_NOT_FOUND" })
            );
        });

        it("GET_STATE rejects an invalid payload with BAD_PAYLOAD", () => {
            const { ctx, ack } = makeMocks();

            handleGetState(ctx, {}, ack);

            expect(lastAck(ack).error.code).toBe("BAD_PAYLOAD");
        });

        it("GET_TURN acks the current turn", () => {
            const { io, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            const gameId = createGameViaHandler(ctx, ack);

            handleGetTurn(ctx, { gameId }, ack);

            expect(lastAck(ack)).toEqual({
                ok: true,
                data: { currentPlayerId: "P1", turnNumber: 1 },
            });
        });

        it("GET_TURN rejects an invalid payload with BAD_PAYLOAD", () => {
            const { ctx, ack } = makeMocks();

            handleGetTurn(ctx, { gameId: 5 }, ack);

            expect(lastAck(ack).error.code).toBe("BAD_PAYLOAD");
        });

        it("GET_LEGAL_MOVES acks the legal cards for a player", () => {
            const { io, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            const gameId = createGameViaHandler(ctx, ack);

            handleGetLegalMoves(ctx, { gameId, playerId: "P1" }, ack);

            const res = lastAck(ack);
            expect(res.ok).toBe(true);
            expect(res.data).toEqual(GameService.getLegalMoves(gameId, "P1"));
            expect(res.data).toHaveLength(13);
        });

        it("GET_LEGAL_MOVES rejects a payload missing playerId", () => {
            const { ctx, ack } = makeMocks();

            handleGetLegalMoves(ctx, { gameId: "g1" }, ack);

            expect(lastAck(ack).error.code).toBe("BAD_PAYLOAD");
        });

        it("GET_HAND acks the player's hand", () => {
            const { io, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            const gameId = createGameViaHandler(ctx, ack);

            handleGetHand(ctx, { gameId, playerId: "P1" }, ack);

            const res = lastAck(ack);
            expect(res.ok).toBe(true);
            expect(res.data).toEqual(GameService.getPlayerHand(gameId, "P1"));
            expect(res.data.cards).toHaveLength(13);
        });

        it("GET_LEGAL_MOVES rejects a socket not bound to the player with UNAUTHORIZED", () => {
            const { io, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            const gameId = createGameViaHandler(ctx, ack);
            ConnectionStore.remove("s1");

            handleGetLegalMoves(ctx, { gameId, playerId: "P1" }, ack);

            expect(lastAck(ack).ok).toBe(false);
            expect(lastAck(ack).error.code).toBe("UNAUTHORIZED");
        });

        it("GET_HAND rejects a socket not bound to the player with UNAUTHORIZED", () => {
            const { io, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            const gameId = createGameViaHandler(ctx, ack);
            ConnectionStore.remove("s1");

            handleGetHand(ctx, { gameId, playerId: "P1" }, ack);

            expect(lastAck(ack).ok).toBe(false);
            expect(lastAck(ack).error.code).toBe("UNAUTHORIZED");
        });

        it("GET_HAND rejects a payload missing playerId", () => {
            const { ctx, ack } = makeMocks();

            handleGetHand(ctx, { gameId: "g1" }, ack);

            expect(lastAck(ack).error.code).toBe("BAD_PAYLOAD");
        });
    });

    describe("GAME:REMOVE", () => {
        it("removes the game, notifies the room, and cleans up connections", () => {
            const { io, socket, roomEmit, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            const gameId = createGameViaHandler(ctx, ack);
            ConnectionStore.add({
                socketId: "s2",
                gameId,
                playerId: "P2",
            });

            handleRemoveGame(ctx, { gameId }, ack);

            expect(lastAck(ack)).toEqual({ ok: true, data: null });
            expect(() => GameSessionManager.get(gameId)).toThrow("Game not found");
            expect(ConnectionStore.get("s1")).toBeUndefined();
            expect(ConnectionStore.get("s2")).toBeUndefined();
            expect(roomEmit).toHaveBeenCalledWith(
                "GAME_REMOVED",
                expect.objectContaining({
                    type: "GAME_REMOVED",
                    payload: { gameId },
                })
            );
            expect(socket.leave).not.toHaveBeenCalled();
        });

        it("rejects removal from a socket that is not the game owner", () => {
            const { io, ctx, ack } = makeMocks();
            GameGateway.initialize(io as any);
            const gameId = createGameViaHandler(ctx, ack);
            ConnectionStore.add({ socketId: "s1", gameId, playerId: "P2" });

            handleRemoveGame(ctx, { gameId }, ack);

            expect(lastAck(ack).ok).toBe(false);
            expect(lastAck(ack).error.code).toBe("UNAUTHORIZED");
            expect(() => GameSessionManager.get(gameId)).not.toThrow();
        });

        it("rejects an unknown game with GAME_NOT_FOUND ack and GAME_ERROR push", () => {
            const { socket, ctx, ack } = makeMocks();

            handleRemoveGame(ctx, { gameId: "nope" }, ack);

            expect(lastAck(ack)).toEqual({
                ok: false,
                error: {
                    code: "GAME_NOT_FOUND",
                    message: "Game not found",
                    gameId: "nope",
                },
            });
            expect(socket.emit).toHaveBeenCalledWith(
                "GAME_ERROR",
                expect.objectContaining({ code: "GAME_NOT_FOUND" })
            );
        });

        it("rejects an invalid payload with BAD_PAYLOAD", () => {
            const { ctx, ack } = makeMocks();

            handleRemoveGame(ctx, {}, ack);

            expect(lastAck(ack).error.code).toBe("BAD_PAYLOAD");
        });
    });
});
