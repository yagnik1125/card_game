import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { GameService } from "../../src/services/GameService.js";
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

async function rest(path: string, body?: any): Promise<any> {
    const response = await fetch(`${server.url}/api/games${path}`, {
        method: "POST",
        headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
}

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

async function createAndJoinWsGame(socket: Socket): Promise<string> {
    const createAck: any = await emitAck(socket, "GAME:CREATE", {
        numberOfRounds: 2,
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

async function playOneCard(socket: Socket, gameId: string): Promise<void> {
    const legalAck: any = await emitAck(socket, "GAME:GET_LEGAL_MOVES", {
        gameId,
        playerId: "P1",
    });
    expect(legalAck.ok).toBe(true);
    const playAck: any = await emitAck(socket, "GAME:PLAY_CARD", {
        gameId,
        playerId: "P1",
        cardId: legalAck.data[0].id,
    });
    expect(playAck.ok).toBe(true);
    await waitForHumanTurn(socket, gameId);
}

describe("Late joiner — mid-game join sync (Phase 7)", () => {
    it("a client joining a WS-created game mid-game receives GAME_STATE immediately", async () => {
        const host: Socket = await connectClient(server.url);
        const gameId = await createAndJoinWsGame(host);
        await playOneCard(host, gameId);
        await playOneCard(host, gameId);

        const late: Socket = await connectClient(server.url);
        const statePromise = nextEvent(late, "GAME_STATE", 3000);
        const joinedPromise = nextEvent(late, "GAME_JOINED", 3000);

        const joinAck: any = await emitAck(late, "GAME:JOIN", {
            gameId,
            playerId: "P1",
        });
        expect(joinAck.ok).toBe(true);

        const joined: any = await joinedPromise;
        expect(joined.gameId).toBe(gameId);

        const envelope: any = await statePromise;
        expect(envelope.type).toBe("GAME_STATE");
        expect(envelope.payload.gameId).toBe(gameId);
        expect(envelope.snapshot).toBeDefined();

        const expected = GameService.getView(gameId);
        expect(envelope.snapshot).toEqual(expected);
        expect(envelope.snapshot.gameId).toBe(gameId);
        expect(envelope.snapshot.completed).toBe(false);
        expect(envelope.snapshot.roundNumber).toBe(1);
        expect(
            envelope.snapshot.players.find((p: any) => p.id === "P1").cardsRemaining
        ).toBe(11);

        const queryAck: any = await emitAck(late, "GAME:GET_STATE", { gameId });
        expect(queryAck.ok).toBe(true);
        expect(queryAck.data.currentPlayerId).toBe(envelope.snapshot.currentPlayerId);

        host.close();
        late.close();
    });

    it("a client joining a REST-created game mid-game receives GAME_STATE immediately", async () => {
        const created = await rest("/create", {
            numberOfRounds: 2,
            difficulty: "easy",
            mode: "SOLO",
        });
        expect(created.status).toBe(201);
        const gameId = created.body.data.gameId;

        const host: Socket = await connectClient(server.url);
        const joinAck: any = await emitAck(host, "GAME:JOIN", {
            gameId,
            playerId: "P1",
        });
        expect(joinAck.ok).toBe(true);
        await playOneCard(host, gameId);

        const late: Socket = await connectClient(server.url);
        const statePromise = nextEvent(late, "GAME_STATE", 3000);
        const lateJoin: any = await emitAck(late, "GAME:JOIN", {
            gameId,
            playerId: "P1",
        });
        expect(lateJoin.ok).toBe(true);

        const envelope: any = await statePromise;
        expect(envelope.type).toBe("GAME_STATE");
        expect(envelope.snapshot).toEqual(GameService.getView(gameId));
        expect(
            envelope.snapshot.players.find((p: any) => p.id === "P1").cardsRemaining
        ).toBe(12);

        host.close();
        late.close();
    });
});
