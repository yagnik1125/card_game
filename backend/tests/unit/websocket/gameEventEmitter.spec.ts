import { beforeEach, describe, expect, it, vi } from "vitest";
import { Suit } from "../../../game-engine/src/core/enums.js";
import { GameEventEmitter, SocketEvents } from "../../../src/websocket/GameEventEmitter.js";
import { GameGateway } from "../../../src/websocket/GameGateway.js";
import { GameService } from "../../../src/services/GameService.js";

describe("GameEventEmitter", () => {
    beforeEach(() => {
        GameGateway.uninitialize();
        vi.clearAllMocks();
    });

    it("every emitter is a safe no-op before the socket server is initialized", () => {
        expect(() =>
            GameEventEmitter.cardPlayed("g1", { playerId: "P1", cardId: "1", suit: Suit.HEARTS, rank: 5 })
        ).not.toThrow();
        expect(() =>
            GameEventEmitter.botPlayed("g1", { playerId: "P2", cardId: "2", suit: Suit.HEARTS, rank: 6 })
        ).not.toThrow();
        expect(() =>
            GameEventEmitter.turnChanged("g1", { currentPlayerId: "P2", turnNumber: 2 })
        ).not.toThrow();
        expect(() =>
            GameEventEmitter.trickCompleted("g1", {
                trickNumber: 1,
                winnerPlayerId: "P1",
                trickWinner: { id: "P1", name: "Player", tricksWonThisRound: 1 },
            })
        ).not.toThrow();
        expect(() =>
            GameEventEmitter.roundCompleted("g1", { roundNumber: 1, winnerPlayerId: "P1" })
        ).not.toThrow();
        expect(() =>
            GameEventEmitter.matchCompleted("g1", { winnerPlayerId: "P1" })
        ).not.toThrow();
    });

    it("emits CARD_PLAYED with envelope after initialize", () => {
        const emit = vi.fn();
        GameGateway.initialize({ to: () => ({ emit }) } as any);

        const payload = { playerId: "P1", cardId: "1", suit: Suit.HEARTS, rank: 5 };
        GameEventEmitter.cardPlayed("g1", payload);

        expect(emit).toHaveBeenCalledWith(
            SocketEvents.CARD_PLAYED,
            expect.objectContaining({
                type: SocketEvents.CARD_PLAYED,
                payload,
                timestamp: expect.any(Number),
            })
        );
    });

    it("emits BOT_PLAY with envelope after initialize", () => {
        const emit = vi.fn();
        GameGateway.initialize({ to: () => ({ emit }) } as any);

        const payload = { playerId: "P2", cardId: "2", suit: Suit.HEARTS, rank: 6 };
        GameEventEmitter.botPlayed("g1", payload);

        expect(emit).toHaveBeenCalledWith(
            SocketEvents.BOT_PLAY,
            expect.objectContaining({
                type: SocketEvents.BOT_PLAY,
                payload,
                timestamp: expect.any(Number),
            })
        );
    });

    it("emits TURN_CHANGED with envelope after initialize", () => {
        const emit = vi.fn();
        GameGateway.initialize({ to: () => ({ emit }) } as any);

        const payload = { currentPlayerId: "P2", turnNumber: 2 };
        GameEventEmitter.turnChanged("g1", payload);

        expect(emit).toHaveBeenCalledWith(
            SocketEvents.TURN_CHANGED,
            expect.objectContaining({
                type: SocketEvents.TURN_CHANGED,
                payload,
                timestamp: expect.any(Number),
            })
        );
    });

    it("emits MATCH_COMPLETED with snapshot after initialize", () => {
        const emit = vi.fn();
        GameGateway.initialize({ to: () => ({ emit }) } as any);
        vi.spyOn(GameService, "getView").mockReturnValue({ gameId: "g1" } as any);

        const payload = { winnerPlayerId: "P1", winnerTeamId: undefined };
        GameEventEmitter.matchCompleted("g1", payload);

        expect(emit).toHaveBeenCalledWith(
            SocketEvents.MATCH_COMPLETED,
            expect.objectContaining({
                type: SocketEvents.MATCH_COMPLETED,
                payload,
                snapshot: { gameId: "g1" },
                timestamp: expect.any(Number),
            })
        );
    });

    it("emits TRICK_COMPLETED with snapshot after initialize", () => {
        const emit = vi.fn();
        GameGateway.initialize({ to: () => ({ emit }) } as any);
        vi.spyOn(GameService, "getView").mockReturnValue({ gameId: "g1" } as any);

        const payload = {
            trickNumber: 1,
            winnerPlayerId: "P1",
            trickWinner: { id: "P1", name: "Player", tricksWonThisRound: 1 },
        };
        GameEventEmitter.trickCompleted("g1", payload);

        expect(emit).toHaveBeenCalledWith(
            SocketEvents.TRICK_COMPLETED,
            expect.objectContaining({
                type: SocketEvents.TRICK_COMPLETED,
                payload,
                snapshot: { gameId: "g1" },
                timestamp: expect.any(Number),
            })
        );
    });

    it("emits ROUND_COMPLETED with snapshot after initialize", () => {
        const emit = vi.fn();
        GameGateway.initialize({ to: () => ({ emit }) } as any);
        vi.spyOn(GameService, "getView").mockReturnValue({ gameId: "g1" } as any);

        const payload = { roundNumber: 1, winnerPlayerId: "P1" };
        GameEventEmitter.roundCompleted("g1", payload);

        expect(emit).toHaveBeenCalledWith(
            SocketEvents.ROUND_COMPLETED,
            expect.objectContaining({
                type: SocketEvents.ROUND_COMPLETED,
                payload,
                snapshot: { gameId: "g1" },
                timestamp: expect.any(Number),
            })
        );
    });

    it("broadcastState pushes GAME_STATE with snapshot after initialize", () => {
        const emit = vi.fn();
        GameGateway.initialize({ to: () => ({ emit }) } as any);
        vi.spyOn(GameService, "getView").mockReturnValue({ gameId: "g1" } as any);

        GameEventEmitter.broadcastState("g1");

        expect(emit).toHaveBeenCalledWith(
            SocketEvents.GAME_STATE,
            expect.objectContaining({
                type: SocketEvents.GAME_STATE,
                payload: { gameId: "g1" },
                snapshot: { gameId: "g1" },
                timestamp: expect.any(Number),
            })
        );
    });
});
