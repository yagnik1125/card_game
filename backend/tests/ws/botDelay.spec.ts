import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
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

async function waitForHumanTurn(socket: Socket, gameId: string): Promise<number> {
    const start = Date.now();
    for (let i = 0; i < 300; i++) {
        const stateAck: any = await emitAck(socket, "GAME:GET_STATE", { gameId });
        if (
            stateAck.ok &&
            (stateAck.data.completed || stateAck.data.currentPlayerId === "P1")
        ) {
            return Date.now() - start;
        }
        await sleep(10);
    }
    throw new Error("Timed out waiting for the bot chain to finish");
}

describe("botDelay — BOT_DELAY_MS controls the per-bot pacing", () => {
    it("plays the full bot chain quickly when BOT_DELAY_MS is set to 50ms", async () => {
        const socket: Socket = await connectClient(server.url);
        const gameId = await createAndJoin(socket);

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

        const elapsed = await waitForHumanTurn(socket, gameId);

        expect(elapsed).toBeLessThan(1000);
        socket.close();
    });

    it("rejects a second play with GAME_BUSY while the bot chain is running", async () => {
        const socket: Socket = await connectClient(server.url);
        const gameId = await createAndJoin(socket);

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

        const busy: any = await emitAck(socket, "GAME:PLAY_CARD", {
            gameId,
            playerId: "P1",
            cardId: legal.data[1]?.id ?? legal.data[0].id,
        });
        expect(busy.ok).toBe(false);
        expect(busy.error.code).toBe("GAME_BUSY");

        socket.close();
    });
});
