import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { GameSessionManager } from "../../game-engine/src/session/GameSessionManager.js";
import { ConnectionStore } from "../../src/websocket/ConnectionStore.js";
import { connectClient, emitAck, sleep } from "../helpers/wsClient.js";
import { resetSessionStore, startTestServer, TestServer } from "../helpers/server.js";
import { Socket } from "socket.io-client";

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

async function waitForHumanTurn(socket: Socket, gameId: string): Promise<void> {
    for (let i = 0; i < 300; i++) {
        const stateAck: any = await emitAck(socket, "GAME:GET_STATE", { gameId });
        if (
            stateAck.ok &&
            (stateAck.data.completed || stateAck.data.currentPlayerId === "P1")
        ) {
            return;
        }
        await sleep(10);
    }
    throw new Error("Timed out waiting for the bot chain to finish");
}

interface StreamEntry {
    name: string;
    envelope: any;
}

describe("Event ordering & snapshot consistency across a full match (Phase 8)", () => {
    it("streams a 2-round SOLO match with ordered tricks, consistent snapshots, and correct winners", async () => {
        const socket: Socket = await connectClient(server.url);
        const stream: StreamEntry[] = [];
        const streamNames = [
            "GAME_CREATED",
            "GAME_JOINED",
            "GAME_STATE",
            "ROUND_STARTED",
            "CARD_PLAYED",
            "BOT_PLAY",
            "TURN_CHANGED",
            "TRUMP_DECLARED",
            "TRICK_COMPLETED",
            "ROUND_COMPLETED",
            "MATCH_COMPLETED",
        ];
        streamNames.forEach((name) =>
            socket.on(name, (envelope: any) => stream.push({ name, envelope }))
        );

        const createAck: any = await emitAck(socket, "GAME:CREATE", {
            numberOfRounds: 2,
            difficulty: "easy",
            mode: "SOLO",
        });
        expect(createAck.ok).toBe(true);
        const gameId: string = createAck.data.gameId;

        const joinAck: any = await emitAck(socket, "GAME:JOIN", { gameId, playerId: "P1" });
        expect(joinAck.ok).toBe(true);

        let guard = 0;
        while (guard++ < 80) {
            const stateAck: any = await emitAck(socket, "GAME:GET_STATE", { gameId });
            if (stateAck.data.completed) {
                break;
            }
            const legalAck: any = await emitAck(socket, "GAME:GET_LEGAL_MOVES", {
                gameId,
                playerId: "P1",
            });
            const playAck: any = await emitAck(socket, "GAME:PLAY_CARD", {
                gameId,
                playerId: "P1",
                cardId: legalAck.data[0].id,
            });
            expect(playAck.ok).toBe(true);
            await waitForHumanTurn(socket, gameId);
        }

        expect(stream.length).toBeGreaterThan(0);
        expect(stream[0].name).toBe("GAME_CREATED");
        expect(stream[stream.length - 1].name).toBe("MATCH_COMPLETED");

        const trickEvents = stream.filter((e) => e.name === "TRICK_COMPLETED");
        expect(trickEvents).toHaveLength(26);

        trickEvents.forEach((entry) => {
            const envelope = entry.envelope;
            expect(envelope.snapshot).toBeDefined();
            expect(envelope.snapshot.currentTrick.trickNumber).toBeGreaterThan(0);
        });

        const trickNumbers = trickEvents.map((e) => e.envelope.payload.trickNumber);
        expect(trickNumbers.slice(0, 13)).toEqual(
            Array.from({ length: 13 }, (_, i) => i + 1)
        );
        expect(trickNumbers.slice(13, 26)).toEqual(
            Array.from({ length: 13 }, (_, i) => i + 1)
        );

        let expectedRemaining = 12;
        for (const entry of trickEvents) {
            const p1 = entry.envelope.snapshot.players.find(
                (p: any) => p.id === "P1"
            );
            expect(p1.cardsRemaining).toBe(expectedRemaining);
            expectedRemaining -= 1;
            if (expectedRemaining === -1) {
                expectedRemaining = 12;
            }
        }

        const roundEvents = stream.filter((e) => e.name === "ROUND_COMPLETED");
        expect(roundEvents).toHaveLength(2);
        roundEvents.forEach((entry, index) => {
            expect(entry.envelope.payload.roundNumber).toBe(index + 1);
            expect(entry.envelope.snapshot.roundNumber).toBe(index + 1);
        });

        const matchEvent = stream.find((e) => e.name === "MATCH_COMPLETED");
        expect(matchEvent!.envelope.snapshot.completed).toBe(true);

        const session = GameSessionManager.get(gameId);
        expect(session.match.result).toBeDefined();
        expect(matchEvent!.envelope.payload.winnerPlayerId).toBe(
            session.match.result!.winnerPlayerId
        );

        const finalAck: any = await emitAck(socket, "GAME:GET_STATE", { gameId });
        expect(finalAck.ok).toBe(true);
        expect(finalAck.data.completed).toBe(true);

        socket.close();
    });
});
