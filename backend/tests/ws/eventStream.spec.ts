import { afterEach, afterAll, beforeAll, describe, expect, it } from "vitest";
import { GameSessionManager } from "../../game-engine/src/session/GameSessionManager.js";
import { connectClient, emitAck, nextEvent } from "../helpers/wsClient.js";
import { resetSessionStore, startTestServer, TestServer } from "../helpers/server.js";
import { makeCard } from "../helpers/engine.js";
import { Suit } from "../../game-engine/src/core/enums.js";

let server: TestServer;

beforeAll(async () => {
    server = await startTestServer();
});

afterEach(() => {
    resetSessionStore();
});

afterAll(async () => {
    await server.close();
});

async function createGame(): Promise<string> {
    const response = await fetch(`${server.url}/api/games/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberOfRounds: 1, difficulty: "easy", mode: "SOLO" }),
    });
    const body = await response.json();
    expect(response.status).toBe(201);
    return body.data.gameId;
}

describe("WS event stream from REST play-turn", () => {
    it("client receives CARD_PLAYED and TURN_CHANGED for a human play", async () => {
        const gameId = await createGame();
        const socket = await connectClient(server.url);
        const ack = await emitAck(socket, "GAME:JOIN", { gameId, playerId: "P1" });
        expect(ack).toEqual({ ok: true, data: { gameId } });

        const legalRes = await fetch(`${server.url}/api/games/${gameId}/legal-moves/P1`);
        const legalBody = await legalRes.json();
        const cardId = legalBody.data[0].id;

        const playedPromise = nextEvent(socket, "CARD_PLAYED", 3000);
        const turnPromise = nextEvent(socket, "TURN_CHANGED", 3000);

        const res = await fetch(`${server.url}/api/games/play-turn`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameId, playerId: "P1", cardId }),
        });
        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);

        const played: any = await playedPromise;
        expect(played.type).toBe("CARD_PLAYED");
        expect(played.payload.playerId).toBe("P1");
        expect(played.payload.cardId).toBe(cardId);

        const turned: any = await turnPromise;
        expect(turned.type).toBe("TURN_CHANGED");
        expect(turned.payload.currentPlayerId).toBe("P2");

        socket.close();
    });

    it("client receives TRICK_COMPLETED with snapshot when human play finishes the trick", async () => {
        const gameId = await createGame();
        const session = GameSessionManager.get(gameId);
        const p1 = session.match.players.find((p: any) => p.id === "P1")!;
        const p2 = session.match.players.find((p: any) => p.id === "P2")!;
        const p3 = session.match.players.find((p: any) => p.id === "P3")!;

        p1.hand = [makeCard(Suit.HEARTS, 5)];
        p2.hand = [makeCard(Suit.HEARTS, 3)];
        p3.hand = [makeCard(Suit.HEARTS, 7)];

        session.gameState!.currentTrick.leadSuit = Suit.HEARTS;
        session.gameState!.currentTrick.plays = [
            { playerId: "P2", card: makeCard(Suit.HEARTS, 3) },
            { playerId: "P3", card: makeCard(Suit.HEARTS, 7) },
        ];
        session.gameState!.turnState.currentPlayerId = "P1";
        GameSessionManager.save(session);

        const socket = await connectClient(server.url);
        const ack = await emitAck(socket, "GAME:JOIN", { gameId, playerId: "P1" });
        expect(ack).toEqual({ ok: true, data: { gameId } });

        const playedPromise = nextEvent(socket, "CARD_PLAYED", 3000);
        const trickPromise = nextEvent(socket, "TRICK_COMPLETED", 3000);

        const res = await fetch(`${server.url}/api/games/play-turn`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameId, playerId: "P1", cardId: p1.hand[0].id }),
        });
        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);

        const played: any = await playedPromise;
        expect(played.type).toBe("CARD_PLAYED");

        const trick: any = await trickPromise;
        expect(trick.type).toBe("TRICK_COMPLETED");
        expect(trick.snapshot).toBeDefined();
        expect(trick.snapshot.gameId).toBe(gameId);

        socket.close();
    });

    it("client receives MATCH_COMPLETED with snapshot when match ends", async () => {
        const gameId = await createGame();
        const session = GameSessionManager.get(gameId);
        const players = session.match.players;
        const p1 = players.find((p: any) => p.id === "P1")!;

        p1.hand = [makeCard(Suit.HEARTS, 5)];
        players.forEach((p: any) => {
            if (p.id !== "P1") {
                p.hand = [];
            }
        });

        session.gameState!.turnState.currentPlayerId = "P1";
        session.gameState!.currentTrick.leadSuit = Suit.HEARTS;
        session.gameState!.currentTrick.plays = [
            { playerId: "P2", card: makeCard(Suit.HEARTS, 3) },
            { playerId: "P3", card: makeCard(Suit.HEARTS, 7) },
            { playerId: "P4", card: makeCard(Suit.HEARTS, 9) },
        ];
        GameSessionManager.save(session);

        const socket = await connectClient(server.url);
        const ack = await emitAck(socket, "GAME:JOIN", { gameId, playerId: "P1" });
        expect(ack).toEqual({ ok: true, data: { gameId } });

        const matchPromise = nextEvent(socket, "MATCH_COMPLETED", 3000);

        const res = await fetch(`${server.url}/api/games/play-turn`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameId, playerId: "P1", cardId: p1.hand[0].id }),
        });
        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);

        const match: any = await matchPromise;
        expect(match.type).toBe("MATCH_COMPLETED");
        expect(match.snapshot).toBeDefined();
        expect(match.snapshot.completed).toBe(true);

        socket.close();
    });
});
