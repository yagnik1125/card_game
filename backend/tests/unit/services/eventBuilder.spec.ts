import { afterEach, describe, expect, it } from "vitest";
import { GameMode, Suit } from "../../../game-engine/src/core/enums.js";
import { EventBuilder, MoveBefore } from "../../../game-engine/src/services/EventBuilder.js";
import { GameSession } from "../../../game-engine/src/session/GameSession.js";
import { GameSessionManager } from "../../../game-engine/src/session/GameSessionManager.js";
import { SessionStore } from "../../../game-engine/src/session/SessionStore.js";
import { PlayCardService } from "../../../game-engine/src/services/PlayCardService.js";
import { BotTurnService } from "../../../game-engine/src/services/BotTurnService.js";
import { GameService } from "../../../src/services/GameService.js";
import { makeCard } from "../../helpers/engine.js";

function captureBefore(session: GameSession): MoveBefore {
    return {
        trickBefore: session.gameState!.currentTrick,
        roundBefore: session.gameState!.currentRound,
        matchBefore: session.gameState!.completed,
        trumpBefore: session.gameState!.currentRound.state.trumpSuit,
        playerStatsBefore: session.match.players.map((p) => ({
            playerId: p.id,
            tricksWonThisRound: p.stats.tricksWonThisRound,
            totalTricksWon: p.stats.totalTricksWon,
            cardsPlayed: p.stats.cardsPlayed,
        })),
        teamStatsBefore:
            session.match.mode === GameMode.TEAMS_2V2
                ? session.match.teams.map((t) => ({
                      id: t.id,
                      name: t.name,
                      tricksWonThisRound: t.tricksWonThisRound,
                      totalTricksWon: t.totalTricksWon,
                      roundsWon: t.roundsWon,
                  }))
                : undefined,
    };
}

function findPlayers(session: GameSession) {
    return {
        p1: session.match.players.find((p: any) => p.id === "P1")!,
        p2: session.match.players.find((p: any) => p.id === "P2")!,
        p3: session.match.players.find((p: any) => p.id === "P3")!,
        p4: session.match.players.find((p: any) => p.id === "P4")!,
    };
}

afterEach(() => {
    SessionStore.getAll().forEach((session) => SessionStore.remove(session.gameId));
});

describe("EventBuilder — shared per-move event builder", () => {
    it("builds a plain CARD_PLAYED event for a non-terminal human move", () => {
        const session = GameService.createGame(1, "easy", GameMode.SOLO);
        const p1 = session.match.players.find((p: any) => p.id === "P1")!;
        const card = p1.hand[0];
        const before = captureBefore(session);

        PlayCardService.playCard(session.gameId, "P1", card);
        const events = EventBuilder.buildMoveEvents(
            GameSessionManager.get(session.gameId),
            "P1",
            card,
            false,
            before
        );

        expect(events).toEqual([
            {
                type: "CARD_PLAYED",
                playerId: "P1",
                cardId: card.id,
                suit: card.suit,
                rank: card.rank,
            },
        ]);
    });

    it("builds TRUMP_DECLARED + BOT_PLAY when a non-champion bot declares trump", () => {
        const session = GameService.createGame(1, "easy", GameMode.SOLO);
        const champion = session.gameState!.currentRound.state.championPlayerId;
        const bot = session.match.players.find((p: any) => p.isBot && p.id !== champion)!;
        const card = makeCard(Suit.SPADES, 10);
        bot.hand = [card, makeCard(Suit.SPADES, 2)];
        session.gameState!.currentTrick.leadSuit = Suit.HEARTS;
        session.gameState!.currentTrick.plays = [
            { playerId: "P1", card: makeCard(Suit.HEARTS, 5) },
        ];
        session.gameState!.currentRound.state.trumpSuit = null;
        session.gameState!.currentRound.state.trumpDeclared = false;
        session.gameState!.turnState.currentPlayerId = bot.id;
        GameSessionManager.save(session);
        const before = captureBefore(session);

        PlayCardService.playCard(session.gameId, bot.id, card);
        const events = EventBuilder.buildMoveEvents(
            GameSessionManager.get(session.gameId),
            bot.id,
            card,
            true,
            before
        );

        expect(events[0]).toEqual({
            type: "TRUMP_DECLARED",
            playerId: bot.id,
            suit: Suit.SPADES,
        });
        expect(events[1]).toEqual({
            type: "BOT_PLAY",
            playerId: bot.id,
            cardId: card.id,
            suit: card.suit,
            rank: card.rank,
        });
    });

    it("builds BOT_PLAY + TRICK_COMPLETED with winner data when the bot finishes the trick", () => {
        const session = GameService.createGame(1, "easy", GameMode.SOLO);
        const { p1, p2, p3, p4 } = findPlayers(session);

        p1.hand = [makeCard(Suit.HEARTS, 5)];
        p2.hand = [makeCard(Suit.HEARTS, 3)];
        p3.hand = [makeCard(Suit.HEARTS, 7)];
        p4.hand = [makeCard(Suit.HEARTS, 9), makeCard(Suit.SPADES, 2)];

        session.gameState!.currentTrick.leadSuit = Suit.HEARTS;
        session.gameState!.currentTrick.plays = [
            { playerId: "P1", card: makeCard(Suit.HEARTS, 5) },
            { playerId: "P2", card: makeCard(Suit.HEARTS, 3) },
            { playerId: "P3", card: makeCard(Suit.HEARTS, 7) },
        ];
        session.gameState!.turnState.currentPlayerId = "P4";
        GameSessionManager.save(session);
        const before = captureBefore(session);
        const card = p4.hand[0];

        PlayCardService.playCard(session.gameId, "P4", card);
        const events = EventBuilder.buildMoveEvents(
            GameSessionManager.get(session.gameId),
            "P4",
            card,
            true,
            before
        );

        expect(events[0].type).toBe("BOT_PLAY");
        expect(events[1]).toMatchObject({
            type: "TRICK_COMPLETED",
            trickNumber: 1,
            playerId: "P4",
            trickWinner: {
                id: "P4",
                tricksWonThisRound: 1,
            },
        });
    });

    it("builds BOT_PLAY + MATCH_COMPLETED with winner data when the final card ends the match", () => {
        const session = GameService.createGame(1, "easy", GameMode.SOLO);
        const { p1, p2, p3, p4 } = findPlayers(session);

        p1.hand = [];
        p2.hand = [];
        p3.hand = [];
        p4.hand = [makeCard(Suit.HEARTS, 9)];

        session.gameState!.currentTrick.leadSuit = Suit.HEARTS;
        session.gameState!.currentTrick.plays = [
            { playerId: "P1", card: makeCard(Suit.HEARTS, 5) },
            { playerId: "P2", card: makeCard(Suit.HEARTS, 3) },
            { playerId: "P3", card: makeCard(Suit.HEARTS, 7) },
        ];
        session.gameState!.turnState.currentPlayerId = "P4";
        GameSessionManager.save(session);
        const before = captureBefore(session);
        const card = p4.hand[0];

        PlayCardService.playCard(session.gameId, "P4", card);
        const after = GameSessionManager.get(session.gameId);
        const events = EventBuilder.buildMoveEvents(after, "P4", card, true, before);

        const matchEvent = events.find((e) => e.type === "MATCH_COMPLETED");
        expect(matchEvent).toBeDefined();
        expect(matchEvent).toMatchObject({
            type: "MATCH_COMPLETED",
            winner: "P4",
            playerId: "P4",
            trickWinner: { id: "P4", tricksWonThisRound: 1 },
            roundWinner: { id: "P4" },
        });
        expect(after.gameState!.completed).toBe(true);
    });

    it("produces identical events for the sync (REST) and async (WS) bot paths via the shared builder", () => {
        const craft = (session: GameSession) => {
            const { p1, p2, p3, p4 } = findPlayers(session);
            p1.hand = [makeCard(Suit.HEARTS, 9), makeCard(Suit.SPADES, 2)];
            p2.hand = [makeCard(Suit.HEARTS, 5)];
            p3.hand = [makeCard(Suit.HEARTS, 7)];
            p4.hand = [makeCard(Suit.HEARTS, 3)];
            session.gameState!.currentTrick.leadSuit = Suit.HEARTS;
            session.gameState!.currentTrick.plays = [
                { playerId: "P1", card: makeCard(Suit.HEARTS, 9) },
                { playerId: "P2", card: makeCard(Suit.HEARTS, 5) },
                { playerId: "P3", card: makeCard(Suit.HEARTS, 7) },
            ];
            session.gameState!.turnState.currentPlayerId = "P4";
            GameSessionManager.save(session);
        };

        const sessionA = GameService.createGame(1, "easy", GameMode.SOLO);
        craft(sessionA);
        const syncEvents = BotTurnService.executeAllBots(sessionA);

        const sessionB = GameService.createGame(1, "easy", GameMode.SOLO);
        craft(sessionB);
        const before = captureBefore(sessionB);
        const b4 = sessionB.match.players.find((p: any) => p.id === "P4")!;
        const card = b4.hand[0];
        PlayCardService.playCard(sessionB.gameId, "P4", card);
        const wsEvents = EventBuilder.buildMoveEvents(
            GameSessionManager.get(sessionB.gameId),
            "P4",
            card,
            true,
            before
        );

        expect(wsEvents).toEqual(syncEvents);
        expect(wsEvents.map((e) => e.type)).toEqual([
            "BOT_PLAY",
            "TRICK_COMPLETED",
        ]);
    });
});
