import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { GameSessionManager } from "../../game-engine/src/session/GameSessionManager.js";
import { ConnectionStore } from "../../src/websocket/ConnectionStore.js";
import { connectClient, emitAck, sleep } from "../helpers/wsClient.js";
import { resetSessionStore, startTestServer, TestServer } from "../helpers/server.js";
import { expectedSoloWinner, expectedTeamWinner } from "../helpers/engine.js";
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

async function playFullMatchWs(
    numberOfRounds: number,
    mode: "SOLO" | "TEAMS_2V2"
): Promise<void> {
    const socket: Socket = await connectClient(server.url);

    const stream: { name: string; envelope: any }[] = [];
    const streamNames = [
        "GAME_CREATED",
        "GAME_JOINED",
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
        numberOfRounds,
        difficulty: "easy",
        mode,
    });
    expect(createAck.ok).toBe(true);
    const gameId: string = createAck.data.gameId;
    expect(createAck.data.snapshot.roundNumber).toBe(1);
    expect(createAck.data.snapshot.currentPlayerId).toBe("P1");

    const joinAck: any = await emitAck(socket, "GAME:JOIN", {
        gameId,
        playerId: "P1",
    });
    expect(joinAck.ok).toBe(true);

    let guard = 0;
    while (guard++ < 80) {
        const stateAck: any = await emitAck(socket, "GAME:GET_STATE", { gameId });
        expect(stateAck.ok).toBe(true);
        if (stateAck.data.completed) {
            break;
        }

        const legalAck: any = await emitAck(socket, "GAME:GET_LEGAL_MOVES", {
            gameId,
            playerId: "P1",
        });
        expect(legalAck.ok).toBe(true);
        expect(legalAck.data.length).toBeGreaterThan(0);

        const playAck: any = await emitAck(socket, "GAME:PLAY_CARD", {
            gameId,
            playerId: "P1",
            cardId: legalAck.data[0].id,
        });
        expect(playAck.ok).toBe(true);
        expect(playAck.data.events.length).toBeGreaterThan(0);
        expect(
            playAck.data.events.some((e: any) => e.type === "CARD_PLAYED")
        ).toBe(true);
        expect(playAck.data.snapshot).toBeDefined();
        expect(playAck.data.snapshot.gameId).toBe(gameId);

        await waitForHumanTurn(socket, gameId);
    }

    const finalState: any = await emitAck(socket, "GAME:GET_STATE", { gameId });
    expect(finalState.ok).toBe(true);
    expect(finalState.data.completed).toBe(true);

    const session = GameSessionManager.get(gameId);
    expect(session.match.state.isCompleted).toBe(true);
    expect(session.match.result).toBeDefined();

    expect(stream.some((e) => e.name === "CARD_PLAYED")).toBe(true);
    expect(stream.some((e) => e.name === "BOT_PLAY")).toBe(true);
    expect(stream.some((e) => e.name === "TURN_CHANGED")).toBe(true);
    expect(stream.some((e) => e.name === "TRICK_COMPLETED")).toBe(true);
    expect(
        stream.filter((e) => e.name === "ROUND_COMPLETED").length
    ).toBe(numberOfRounds);

    const matchEnded = stream.find((e) => e.name === "MATCH_COMPLETED");
    expect(matchEnded).toBeDefined();
    expect(matchEnded!.envelope.snapshot).toBeDefined();
    expect(matchEnded!.envelope.snapshot.completed).toBe(true);
    expect(matchEnded!.envelope.payload).toBeDefined();

    if (mode === "SOLO") {
        expect(matchEnded!.envelope.payload.winnerPlayerId).toBe(
            session.match.result!.winnerPlayerId
        );
        expect(session.match.result!.winnerPlayerId).toBe(
            expectedSoloWinner(session.match.players)
        );
    } else {
        expect(matchEnded!.envelope.payload.winnerTeamId).toBe(
            session.match.result!.winnerTeamId
        );
        expect(session.match.result!.winnerTeamId).toBe(
            expectedTeamWinner(session.match.teams)
        );
    }

    socket.close();
}

describe("WS-only full match — primary acceptance test (Phase 7)", () => {
    it("completes a full SOLO match using only WebSocket commands", async () => {
        await playFullMatchWs(2, "SOLO");
    });

    it("completes a full TEAMS_2V2 match using only WebSocket commands", async () => {
        await playFullMatchWs(2, "TEAMS_2V2");
    });
});
