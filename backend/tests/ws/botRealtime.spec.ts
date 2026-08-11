import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Suit } from "../../game-engine/src/core/enums.js";
import { GameSessionManager } from "../../game-engine/src/session/GameSessionManager.js";
import { ConnectionStore } from "../../src/websocket/ConnectionStore.js";
import { connectClient, emitAck, nextEvent } from "../helpers/wsClient.js";
import { resetSessionStore, startTestServer, TestServer } from "../helpers/server.js";
import { Socket } from "socket.io-client";
import { makeCard } from "../helpers/engine.js";

process.env.BOT_DELAY_MS = "50";

let server: TestServer;

beforeAll(async () => {
    server = await startTestServer();
});

afterEach(() => {
    resetSessionStore();
    ConnectionStore.clear();
});

afterAll(async () => {
    await server.close();
});

async function createAndJoin(socket: Socket): Promise<string> {
    const createAck: any = await emitAck(socket, "GAME:CREATE", {
        numberOfRounds: 1,
        difficulty: "easy",
        mode: "SOLO",
    });
    expect(createAck.ok).toBe(true);
    const gameId: string = createAck.data.gameId;
    const joinAck: any = await emitAck(socket, "GAME:JOIN", {
        gameId,
        playerId: "P1",
    });
    expect(joinAck.ok).toBe(true);
    return gameId;
}

function collectStream(socket: Socket): { name: string; envelope: any }[] {
    const stream: { name: string; envelope: any }[] = [];
    const names = [
        "CARD_PLAYED",
        "BOT_PLAY",
        "TURN_CHANGED",
        "TRUMP_DECLARED",
        "TRICK_COMPLETED",
        "ROUND_COMPLETED",
        "MATCH_COMPLETED",
    ];
    names.forEach((name) =>
        socket.on(name, (envelope: any) => stream.push({ name, envelope }))
    );
    return stream;
}

describe("botRealtime — bots play visibly one-by-one with the full event set (BUG-5)", () => {
    it("streams CARD_PLAYED, then per-bot BOT_PLAY + TURN_CHANGED, then TRICK_COMPLETED with a snapshot", async () => {
        const socket: Socket = await connectClient(server.url);
        const gameId = await createAndJoin(socket);
        const stream = collectStream(socket);

        const trickPromise = nextEvent(socket, "TRICK_COMPLETED", 5000);

        const legal: any = await emitAck(socket, "GAME:GET_LEGAL_MOVES", {
            gameId,
            playerId: "P1",
        });
        const play: any = await emitAck(socket, "GAME:PLAY_CARD", {
            gameId,
            playerId: "P1",
            cardId: legal.data[0].id,
        });
        expect(play.ok).toBe(true);
        expect(
            play.data.events.some((e: any) => e.type === "CARD_PLAYED")
        ).toBe(true);

        const trickEnvelope: any = await trickPromise;
        expect(trickEnvelope.type).toBe("TRICK_COMPLETED");
        expect(trickEnvelope.payload.trickWinner.id).toBeTruthy();
        expect(trickEnvelope.snapshot).toBeDefined();

        const idxCard = stream.findIndex((e) => e.name === "CARD_PLAYED");
        const idxBot = stream.findIndex((e) => e.name === "BOT_PLAY");
        expect(idxCard).toBeGreaterThanOrEqual(0);
        expect(idxBot).toBeGreaterThan(idxCard);
        expect(stream.some((e) => e.name === "TURN_CHANGED")).toBe(true);
        expect(stream.some((e) => e.name === "BOT_PLAY")).toBe(true);

        socket.close();
    });

    it("ends a crafted short match with TRICK_COMPLETED, ROUND_COMPLETED and MATCH_COMPLETED winners + snapshots", async () => {
        const socket: Socket = await connectClient(server.url);
        const gameId = await createAndJoin(socket);

        const session = GameSessionManager.get(gameId);
        const p1 = session.match.players.find((p: any) => p.id === "P1")!;
        const p2 = session.match.players.find((p: any) => p.id === "P2")!;
        const p3 = session.match.players.find((p: any) => p.id === "P3")!;
        const p4 = session.match.players.find((p: any) => p.id === "P4")!;

        p1.hand = [makeCard(Suit.HEARTS, 5)];
        p2.hand = [makeCard(Suit.HEARTS, 3)];
        p3.hand = [makeCard(Suit.HEARTS, 7)];
        p4.hand = [makeCard(Suit.HEARTS, 9)];
        session.gameState!.currentTrick.leadSuit = null;
        session.gameState!.currentTrick.plays = [];
        session.gameState!.turnState.currentPlayerId = "P1";
        GameSessionManager.save(session);

        const stream = collectStream(socket);
        const matchPromise = nextEvent(socket, "MATCH_COMPLETED", 5000);

        const play: any = await emitAck(socket, "GAME:PLAY_CARD", {
            gameId,
            playerId: "P1",
            cardId: p1.hand[0].id,
        });
        expect(play.ok).toBe(true);

        const matchEnvelope: any = await matchPromise;
        expect(matchEnvelope.type).toBe("MATCH_COMPLETED");
        expect(matchEnvelope.payload.winnerPlayerId).toBe("P4");
        expect(matchEnvelope.snapshot).toBeDefined();
        expect(matchEnvelope.snapshot.completed).toBe(true);

        expect(stream.some((e) => e.name === "CARD_PLAYED")).toBe(true);
        expect(stream.some((e) => e.name === "BOT_PLAY")).toBe(true);

        const trickEv = stream.find((e) => e.name === "TRICK_COMPLETED");
        expect(trickEv).toBeDefined();
        expect(trickEv!.envelope.snapshot).toBeDefined();
        expect(trickEv!.envelope.payload.trickWinner.id).toBe("P4");

        const roundEv = stream.find((e) => e.name === "ROUND_COMPLETED");
        expect(roundEv).toBeDefined();
        expect(roundEv!.envelope.snapshot).toBeDefined();

        socket.close();
    });
});
