import { describe, expect, it } from "vitest";
import { Suit } from "../../../game-engine/src/core/enums.js";
import { errorAck, okAck, WsAck } from "../../../src/websocket/protocol/responses.js";
import {
    SERVER_EVENT_NAMES,
    ServerEnvelope,
    ServerEvent,
} from "../../../src/websocket/protocol/serverEvents.js";

describe("server event contracts", () => {
    it("CARD_PLAYED carries playerId, cardId, suit, and rank", () => {
        const event: ServerEvent = {
            type: "CARD_PLAYED",
            payload: {
                playerId: "P1",
                cardId: "1",
                suit: Suit.HEARTS,
                rank: 5,
            },
        };
        expect(event.type).toBe("CARD_PLAYED");
        expect(event.payload.suit).toBe(Suit.HEARTS);
        expect(event.payload.rank).toBe(5);
    });

    it("TURN_CHANGED carries currentPlayerId and turnNumber", () => {
        const event: ServerEvent = {
            type: "TURN_CHANGED",
            payload: { currentPlayerId: "P2", turnNumber: 2 },
        };
        expect(event.type).toBe("TURN_CHANGED");
        expect(event.payload).toEqual({ currentPlayerId: "P2", turnNumber: 2 });
    });

    it("TRUMP_DECLARED carries playerId and suit", () => {
        const event: ServerEvent = {
            type: "TRUMP_DECLARED",
            payload: { playerId: "P3", suit: Suit.SPADES },
        };
        expect(event.type).toBe("TRUMP_DECLARED");
        expect(event.payload.suit).toBe(Suit.SPADES);
    });

    it("TRICK_COMPLETED carries winner data with optional team winner", () => {
        const winner = { id: "P2", name: "Bot 1", tricksWonThisRound: 1 };
        const withTeam: ServerEvent = {
            type: "TRICK_COMPLETED",
            payload: {
                trickNumber: 1,
                winnerPlayerId: "P2",
                trickWinner: winner,
                trickWinnerTeam: {
                    id: "TEAM_B",
                    name: "B",
                    tricksWonThisRound: 0,
                    totalTricksWon: 3,
                    roundsWon: 1,
                },
            },
        };
        const withoutTeam: ServerEvent = {
            type: "TRICK_COMPLETED",
            payload: { trickNumber: 1, winnerPlayerId: "P2", trickWinner: winner },
        };
        expect(withTeam.type).toBe("TRICK_COMPLETED");
        expect(withTeam.payload.trickWinnerTeam?.id).toBe("TEAM_B");
        expect(withoutTeam.payload.trickWinnerTeam).toBeUndefined();
    });

    it("GAME_ERROR carries code and message with optional gameId", () => {
        const withGame: ServerEvent = {
            type: "GAME_ERROR",
            payload: { code: "GAME_NOT_FOUND", message: "nope", gameId: "g1" },
        };
        const withoutGame: ServerEvent = {
            type: "GAME_ERROR",
            payload: { code: "BAD_PAYLOAD", message: "bad" },
        };
        expect(withGame.payload.gameId).toBe("g1");
        expect(withoutGame.payload.gameId).toBeUndefined();
    });

    it("all server event names are listed in the protocol", () => {
        expect(SERVER_EVENT_NAMES).toContain("GAME_CREATED");
        expect(SERVER_EVENT_NAMES).toContain("ROUND_STARTED");
        expect(SERVER_EVENT_NAMES).toContain("MATCH_COMPLETED");
        expect(SERVER_EVENT_NAMES).toContain("GAME_STATE");
        expect(SERVER_EVENT_NAMES).toContain("GAME_ERROR");
    });

    it("ServerEnvelope carries type, payload, snapshot, and timestamp", () => {
        const envelope: ServerEnvelope = {
            type: "GAME_STATE",
            payload: { gameId: "g1", snapshot: { completed: false } },
            snapshot: { completed: false },
            timestamp: 1723000000000,
        };
        expect(envelope.type).toBe("GAME_STATE");
        expect(envelope.timestamp).toBeGreaterThan(0);
    });
});

describe("ack envelope helpers", () => {
    it("okAck builds a success ack with data", () => {
        const ack: WsAck<{ gameId: string }> = okAck({ gameId: "g1" });
        expect(ack).toEqual({ ok: true, data: { gameId: "g1" } });
    });

    it("okAck with no data still reports success", () => {
        const ack: WsAck = okAck(null);
        expect(ack.ok).toBe(true);
    });

    it("errorAck builds a failure ack with error details", () => {
        const ack: WsAck = errorAck("GAME_NOT_FOUND", "Game not found", "g1");
        expect(ack.ok).toBe(false);
        expect(ack.error).toEqual({
            code: "GAME_NOT_FOUND",
            message: "Game not found",
            gameId: "g1",
        });
    });
});
