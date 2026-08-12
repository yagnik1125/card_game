import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GameMode, Suit } from "../../../game-engine/src/core/enums.js";
import { EventBus } from "../../../game-engine/src/events/EventBus.js";
import { GameSession } from "../../../game-engine/src/session/GameSession.js";
import { GameSessionManager } from "../../../game-engine/src/session/GameSessionManager.js";
import { SessionStore } from "../../../game-engine/src/session/SessionStore.js";
import { PlayCardService } from "../../../game-engine/src/services/PlayCardService.js";
import { GameService } from "../../../src/services/GameService.js";
import { BotScheduler } from "../../../src/services/BotScheduler.js";
import { InFlightGuard } from "../../../src/services/InFlightGuard.js";
import { GameGateway } from "../../../src/websocket/GameGateway.js";
import { makeCard } from "../../helpers/engine.js";

describe("BotScheduler", () => {
    let gameId: string;

    beforeEach(() => {
        vi.useFakeTimers();
        GameGateway.initialize({
            to: () => ({ emit: () => {} }),
        } as any);
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.restoreAllMocks();
        vi.useRealTimers();
        EventBus.clear();
        InFlightGuard.clear();
        SessionStore.getAll().forEach((session) => SessionStore.remove(session.gameId));
    });

    it("bot follows the lead suit instead of blindly playing hand[0] (BUG-2)", () => {
        const session: GameSession = GameService.createGame(1, "easy", GameMode.SOLO);
        gameId = session.gameId;
        const p4 = session.match.players.find((p: any) => p.id === "P4")!;

        p4.hand = [
            makeCard(Suit.CLUBS, 10),
            makeCard(Suit.HEARTS, 3),
            makeCard(Suit.HEARTS, 7),
        ];
        session.gameState!.currentTrick.leadSuit = Suit.HEARTS;
        session.gameState!.currentTrick.plays = [
            { playerId: "P1", card: makeCard(Suit.HEARTS, 5) },
        ];
        session.gameState!.turnState.currentPlayerId = "P4";
        GameSessionManager.save(session);

        BotScheduler.executeNextBot(gameId);

        const updated = GameSessionManager.get(gameId);
        const plays = updated.gameState!.currentTrick.plays;
        const lastPlay = plays[plays.length - 1];

        expect(lastPlay.playerId).toBe("P4");
        expect(lastPlay.card.suit).toBe(Suit.HEARTS);
        expect(updated.match.players.find((p: any) => p.id === "P4")!.hand).toHaveLength(2);
    });

    it("stops the bot chain when the human player's turn arrives", () => {
        const session: GameSession = GameService.createGame(1, "easy", GameMode.SOLO);
        gameId = session.gameId;
        session.gameState!.turnState.currentPlayerId = "P4";
        GameSessionManager.save(session);

        BotScheduler.executeNextBot(gameId);

        const updated = GameSessionManager.get(gameId);
        expect(updated.gameState!.turnState.currentPlayerId).toBe("P1");
    });

    it("stops the chain when the match has ended", () => {
        const session: GameSession = GameService.createGame(1, "easy", GameMode.SOLO);
        gameId = session.gameId;
        session.gameState!.completed = true;
        GameSessionManager.save(session);
        InFlightGuard.tryAcquire(gameId);

        BotScheduler.executeNextBot(gameId);

        const updated = GameSessionManager.get(gameId);
        expect(updated.gameState!.currentTrick.plays).toHaveLength(0);
        expect(InFlightGuard.isInFlight(gameId)).toBe(false);
    });

    it("stops the chain when the game has been removed", () => {
        const session: GameSession = GameService.createGame(1, "easy", GameMode.SOLO);
        gameId = session.gameId;
        GameSessionManager.remove(gameId);
        InFlightGuard.tryAcquire(gameId);

        expect(() => BotScheduler.executeNextBot(gameId)).not.toThrow();
        expect(InFlightGuard.isInFlight(gameId)).toBe(false);
    });

    it("stops the chain on an engine error and releases the guard", () => {
        const session: GameSession = GameService.createGame(1, "easy", GameMode.SOLO);
        gameId = session.gameId;
        session.gameState!.turnState.currentPlayerId = "P4";
        GameSessionManager.save(session);
        InFlightGuard.tryAcquire(gameId);
        vi.spyOn(PlayCardService, "playCard").mockImplementation(() => {
            throw new Error("boom");
        });

        expect(() => BotScheduler.executeNextBot(gameId)).not.toThrow();

        const updated = GameSessionManager.get(gameId);
        expect(updated.gameState!.currentTrick.plays).toHaveLength(0);
        expect(InFlightGuard.isInFlight(gameId)).toBe(false);
    });

    it("never plays from a stale timer when the turn state does not match (turn-version guard)", () => {
        const session: GameSession = GameService.createGame(1, "easy", GameMode.SOLO);
        gameId = session.gameId;

        BotScheduler.executeNextBot(gameId, {
            currentPlayerId: "P9",
            turnNumber: 999,
        });

        const updated = GameSessionManager.get(gameId);
        expect(updated.gameState!.currentTrick.plays).toHaveLength(0);
    });

    it("releases the in-flight guard when the chain reaches the human turn", () => {
        const session: GameSession = GameService.createGame(1, "easy", GameMode.SOLO);
        gameId = session.gameId;
        session.gameState!.turnState.currentPlayerId = "P4";
        GameSessionManager.save(session);
        InFlightGuard.tryAcquire(gameId);

        expect(InFlightGuard.isInFlight(gameId)).toBe(true);

        BotScheduler.executeNextBot(gameId);

        expect(InFlightGuard.isInFlight(gameId)).toBe(false);
    });

    it("reads BOT_DELAY_MS for the per-bot delay and defaults to 1000", () => {
        const previous = process.env.BOT_DELAY_MS;
        try {
            delete process.env.BOT_DELAY_MS;
            expect(BotScheduler.delayMs()).toBe(1000);
            process.env.BOT_DELAY_MS = "50";
            expect(BotScheduler.delayMs()).toBe(50);
            process.env.BOT_DELAY_MS = "not-a-number";
            expect(BotScheduler.delayMs()).toBe(1000);
            process.env.BOT_DELAY_MS = "-5";
            expect(BotScheduler.delayMs()).toBe(1000);
        } finally {
            if (previous === undefined) {
                delete process.env.BOT_DELAY_MS;
            } else {
                process.env.BOT_DELAY_MS = previous;
            }
        }
    });
});
