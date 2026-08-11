import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Suit } from "../../../game-engine/src/core/enums.js";
import { GameEventEmitter, SocketEvents } from "../../../src/websocket/GameEventEmitter.js";
import { GameEventBridge } from "../../../src/websocket/GameEventBridge.js";
import { EventBus } from "../../../game-engine/src/events/EventBus.js";
import { GameService } from "../../../src/services/GameService.js";

describe("GameEventBridge", () => {
    beforeEach(() => {
        EventBus.clear();
        vi.clearAllMocks();
    });

    it("forwards CARD_PLAYED from EventBus to GameEventEmitter", () => {
        const spy = vi.spyOn(GameEventEmitter, "cardPlayed").mockImplementation(() => {});
        GameEventBridge.start();

        EventBus.publish({
            gameId: "g1",
            event: {
                type: "CARD_PLAYED",
                playerId: "P1",
                cardId: "c1",
                suit: "HEARTS",
                rank: 5,
            },
        });

        expect(spy).toHaveBeenCalledWith("g1", {
            playerId: "P1",
            cardId: "c1",
            suit: "HEARTS",
            rank: 5,
        });
    });

    it("forwards BOT_PLAY from EventBus to GameEventEmitter", () => {
        const spy = vi.spyOn(GameEventEmitter, "botPlayed").mockImplementation(() => {});
        GameEventBridge.start();

        EventBus.publish({
            gameId: "g1",
            event: {
                type: "BOT_PLAY",
                playerId: "P2",
                cardId: "c2",
                suit: "CLUBS",
                rank: 10,
            },
        });

        expect(spy).toHaveBeenCalledWith("g1", {
            playerId: "P2",
            cardId: "c2",
            suit: "CLUBS",
            rank: 10,
        });
    });

    it("forwards TURN_CHANGED from EventBus to GameEventEmitter", () => {
        const spy = vi.spyOn(GameEventEmitter, "turnChanged").mockImplementation(() => {});
        GameEventBridge.start();

        EventBus.publish({
            gameId: "g1",
            event: {
                type: "TURN_CHANGED",
                currentPlayerId: "P2",
                turnNumber: 2,
            },
        });

        expect(spy).toHaveBeenCalledWith("g1", {
            currentPlayerId: "P2",
            turnNumber: 2,
        });
    });

    it("forwards TRUMP_DECLARED from EventBus to GameEventEmitter", () => {
        const spy = vi.spyOn(GameEventEmitter, "trumpDeclared").mockImplementation(() => {});
        GameEventBridge.start();

        EventBus.publish({
            gameId: "g1",
            event: {
                type: "TRUMP_DECLARED",
                playerId: "P1",
                suit: Suit.HEARTS,
            },
        });

        expect(spy).toHaveBeenCalledWith("g1", {
            playerId: "P1",
            suit: Suit.HEARTS,
        });
    });

    it("forwards TRICK_COMPLETED from EventBus to GameEventEmitter", () => {
        const spy = vi.spyOn(GameEventEmitter, "trickCompleted").mockImplementation(() => {});
        GameEventBridge.start();

        EventBus.publish({
            gameId: "g1",
            event: {
                type: "TRICK_COMPLETED",
                trickNumber: 1,
                playerId: "P1",
                trickWinner: { id: "P1", name: "Player", tricksWonThisRound: 1 },
                trickWinnerTeam: { id: "T1", name: "Team 1", tricksWonThisRound: 1, totalTricksWon: 1, roundsWon: 0 },
            },
        });

        expect(spy).toHaveBeenCalledWith("g1", {
            trickNumber: 1,
            winnerPlayerId: "P1",
            trickWinner: { id: "P1", name: "Player", tricksWonThisRound: 1 },
            trickWinnerTeam: { id: "T1", name: "Team 1", tricksWonThisRound: 1, totalTricksWon: 1, roundsWon: 0 },
        });
    });

    it("forwards ROUND_COMPLETED from EventBus to GameEventEmitter", () => {
        const spy = vi.spyOn(GameEventEmitter, "roundCompleted").mockImplementation(() => {});
        GameEventBridge.start();

        EventBus.publish({
            gameId: "g1",
            event: {
                type: "ROUND_COMPLETED",
                roundNumber: 1,
                playerId: "P1",
                trickWinner: { id: "P1", name: "Player", tricksWonThisRound: 5 },
                roundWinner: {
                    id: "P1",
                    name: "Player",
                    players: [
                        { id: "P1", name: "Player", tricksWonThisRound: 5 },
                        { id: "P2", name: "Bot 2", tricksWonThisRound: 3 },
                    ],
                },
                roundWinnerTeam: {
                    id: "T1",
                    name: "Team 1",
                    teams: [
                        { id: "T1", name: "Team 1", tricksWonThisRound: 5, totalTricksWon: 5, roundsWon: 1 },
                    ],
                },
            },
        });

        expect(spy).toHaveBeenCalledWith("g1", {
            roundNumber: 1,
            winnerPlayerId: "P1",
            trickWinner: { id: "P1", name: "Player", tricksWonThisRound: 5 },
            roundWinner: {
                id: "P1",
                name: "Player",
                players: [
                    { id: "P1", name: "Player", tricksWonThisRound: 5 },
                    { id: "P2", name: "Bot 2", tricksWonThisRound: 3 },
                ],
            },
            roundWinnerTeam: {
                id: "T1",
                name: "Team 1",
                teams: [
                    { id: "T1", name: "Team 1", tricksWonThisRound: 5, totalTricksWon: 5, roundsWon: 1 },
                ],
            },
        });
    });

    it("forwards MATCH_COMPLETED from EventBus to GameEventEmitter", () => {
        const spy = vi.spyOn(GameEventEmitter, "matchCompleted").mockImplementation(() => {});
        GameEventBridge.start();

        EventBus.publish({
            gameId: "g1",
            event: {
                type: "MATCH_COMPLETED",
                winner: "P1",
                winnerTeam: "T1",
                playerId: "P1",
            },
        });

        expect(spy).toHaveBeenCalledWith("g1", {
            winnerPlayerId: "P1",
            winnerTeamId: "T1",
            roundWinner: undefined,
            roundWinnerTeam: undefined,
        });
    });

    it("forwards ROUND_STARTED from EventBus to GameEventEmitter", () => {
        const spy = vi.spyOn(GameEventEmitter, "roundStarted").mockImplementation(() => {});
        GameEventBridge.start();

        EventBus.publish({
            gameId: "g1",
            event: {
                type: "ROUND_STARTED",
                roundNumber: 2,
                championPlayerId: "P1",
                championTeamId: null,
            },
        });

        expect(spy).toHaveBeenCalledWith("g1", {
            gameId: "g1",
            roundNumber: 2,
            championPlayerId: "P1",
            championTeamId: null,
        });
    });

    it("ignores unknown event types safely", () => {
        const spy = vi.spyOn(GameEventEmitter, "cardPlayed");
        const spy2 = vi.spyOn(GameEventEmitter, "turnChanged");
        GameEventBridge.start();

        EventBus.publish({
            gameId: "g1",
            event: {
                type: "UNKNOWN_EVENT",
                foo: "bar",
            } as any,
        });

        expect(spy).not.toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
    });
});
