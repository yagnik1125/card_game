import { beforeEach, describe, expect, it, vi } from "vitest";
import { Suit } from "../../../game-engine/src/core/enums.js";
import { GameEventEmitter, SocketEvents } from "../../../src/websocket/GameEventEmitter.js";
import { GameGateway } from "../../../src/websocket/GameGateway.js";
import { GameService } from "../../../src/services/GameService.js";

describe("GameEventEmitter — typed payloads", () => {
    beforeEach(() => {
        GameGateway.uninitialize();
        vi.clearAllMocks();
    });

    it("emits GAME_CREATED with envelope after initialize", () => {
        const emit = vi.fn();
        GameGateway.initialize({ to: () => ({ emit }) } as any);

        GameEventEmitter.gameCreated("g1");

        expect(emit).toHaveBeenCalledWith(
            SocketEvents.GAME_CREATED,
            expect.objectContaining({
                type: SocketEvents.GAME_CREATED,
                payload: { gameId: "g1" },
                timestamp: expect.any(Number),
            })
        );
    });

    it("emits ROUND_STARTED with envelope after initialize", () => {
        const emit = vi.fn();
        GameGateway.initialize({ to: () => ({ emit }) } as any);

        const payload = {
            gameId: "g1",
            roundNumber: 2,
            championPlayerId: "P1",
            championTeamId: null,
        };
        GameEventEmitter.roundStarted("g1", payload);

        expect(emit).toHaveBeenCalledWith(
            SocketEvents.ROUND_STARTED,
            expect.objectContaining({
                type: SocketEvents.ROUND_STARTED,
                payload,
                timestamp: expect.any(Number),
            })
        );
    });

    it("emits TRUMP_DECLARED with envelope after initialize", () => {
        const emit = vi.fn();
        GameGateway.initialize({ to: () => ({ emit }) } as any);

        const payload = { playerId: "P1", suit: Suit.HEARTS };
        GameEventEmitter.trumpDeclared("g1", payload);

        expect(emit).toHaveBeenCalledWith(
            SocketEvents.TRUMP_DECLARED,
            expect.objectContaining({
                type: SocketEvents.TRUMP_DECLARED,
                payload,
                timestamp: expect.any(Number),
            })
        );
    });

    it("emits GAME_ERROR with envelope after initialize", () => {
        const emit = vi.fn();
        GameGateway.initialize({ to: () => ({ emit }) } as any);

        const payload = { code: "BAD_PAYLOAD", message: "Invalid payload", gameId: "g1" };
        GameEventEmitter.gameError("g1", payload);

        expect(emit).toHaveBeenCalledWith(
            SocketEvents.GAME_ERROR,
            expect.objectContaining({
                type: SocketEvents.GAME_ERROR,
                payload,
                timestamp: expect.any(Number),
            })
        );
    });

    it("stateSync delegates to broadcastState after initialize", () => {
        const emit = vi.fn();
        GameGateway.initialize({ to: () => ({ emit }) } as any);
        vi.spyOn(GameService, "getView").mockReturnValue({ gameId: "g1" } as any);

        GameEventEmitter.stateSync("g1");

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
