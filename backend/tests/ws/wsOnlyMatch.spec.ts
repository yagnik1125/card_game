import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { GameSessionManager } from "../../game-engine/src/session/GameSessionManager.js";
import { ConnectionStore } from "../../src/websocket/ConnectionStore.js";
import { connectClient, emitAck, nextEvent, sleep } from "../helpers/wsClient.js";
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

async function waitForTurnBack(socket: Socket, gameId: string): Promise<void> {
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

async function playWsOnlyMatch(
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

    const created = nextEvent(socket, "GAME_CREATED");
    const createAck: any = await emitAck(socket, "GAME:CREATE", {
        numberOfRounds,
        difficulty: "easy",
        mode,
    });
    expect(createAck.ok).toBe(true);
    expect(createAck.data.gameId).toBeTruthy();
    expect(createAck.data.snapshot.roundNumber).toBe(1);
    expect(createAck.data.snapshot.currentPlayerId).toBe("P1");

    const gameId: string = createAck.data.gameId;

    const createdPayload: any = await created;
    expect(createdPayload.type).toBe("GAME_CREATED");
    expect(createdPayload.payload.gameId).toBe(gameId);

    const joined = nextEvent(socket, "GAME_JOINED");
    const joinAck: any = await emitAck(socket, "GAME:JOIN", {
        gameId,
        playerId: "P1",
    });
    expect(joinAck).toEqual({ ok: true, data: { gameId } });
    const joinedPayload: any = await joined;
    expect(joinedPayload.playerId).toBe("P1");

    let guard = 0;
    let pushedPlayChecked = false;

    while (guard++ < 60) {
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
        const cardId: string = legalAck.data[0].id;

        let pushedPlay: Promise<unknown> | undefined;
        if (!pushedPlayChecked) {
            pushedPlay = nextEvent(socket, "CARD_PLAYED");
            pushedPlayChecked = true;
        }

        const playAck: any = await emitAck(socket, "GAME:PLAY_CARD", {
            gameId,
            playerId: "P1",
            cardId,
        });
        expect(playAck.ok).toBe(true);
        expect(playAck.data.events.length).toBeGreaterThan(0);
        expect(
            playAck.data.events.some((e: any) => e.type === "CARD_PLAYED")
        ).toBe(true);
        expect(playAck.data.snapshot).toBeDefined();
        expect(playAck.data.snapshot.gameId).toBe(gameId);

        if (pushedPlay) {
            const pushed: any = await pushedPlay;
            expect(pushed.type).toBe("CARD_PLAYED");
            expect(pushed.payload.playerId).toBe("P1");
            expect(pushed.payload.cardId).toBe(cardId);
        }

        await waitForTurnBack(socket, gameId);
    }

    const finalState: any = await emitAck(socket, "GAME:GET_STATE", { gameId });
    expect(finalState.ok).toBe(true);
    expect(finalState.data.completed).toBe(true);

    expect(stream.some((e) => e.name === "CARD_PLAYED")).toBe(true);
    expect(stream.some((e) => e.name === "BOT_PLAY")).toBe(true);
    expect(stream.some((e) => e.name === "TURN_CHANGED")).toBe(true);
    expect(stream.some((e) => e.name === "TRICK_COMPLETED")).toBe(true);
    expect(stream.some((e) => e.name === "ROUND_COMPLETED")).toBe(true);

    const matchEnded: any = stream.find((e) => e.name === "MATCH_COMPLETED");
    expect(matchEnded).toBeDefined();
    expect(matchEnded.envelope.snapshot).toBeDefined();
    expect(matchEnded.envelope.snapshot.completed).toBe(true);

    const session = GameSessionManager.get(gameId);
    expect(session.match.state.isCompleted).toBe(true);
    if (mode === "SOLO") {
        expect(matchEnded.envelope.payload.winnerPlayerId).toBe(
            session.match.result!.winnerPlayerId
        );
    } else {
        expect(matchEnded.envelope.payload.winnerTeamId).toBe(
            session.match.result!.winnerTeamId
        );
    }

    socket.close();
}

describe("WS-only match — full gameplay without REST", () => {
    it("completes a full SOLO match using only WebSocket commands", async () => {
        await playWsOnlyMatch(2, "SOLO");
    });

    it("completes a full TEAMS_2V2 match using only WebSocket commands", async () => {
        await playWsOnlyMatch(2, "TEAMS_2V2");
    });
});
