import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { connectClient, emitAck, nextEvent } from "../helpers/wsClient.js";
import { resetSessionStore, startTestServer, TestServer } from "../helpers/server.js";
import { ConnectionStore } from "../../src/websocket/ConnectionStore.js";

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

describe("WebSocket rooms — error paths", () => {
    it("joining a non-existent game returns an error ack and pushes GAME_ERROR", async () => {
        const socket = await connectClient(server.url);
        const errorEvent = nextEvent(socket, "GAME_ERROR");
        const ack = await emitAck(socket, "GAME:JOIN", { gameId: "nope", playerId: "P1" });

        expect(ack).toEqual({
            ok: false,
            error: { code: "GAME_NOT_FOUND", message: "Game not found", gameId: "nope" },
        });
        const errorPayload = await errorEvent;
        expect(errorPayload.code).toBe("GAME_NOT_FOUND");
        expect(errorPayload.gameId).toBe("nope");
        expect(ConnectionStore.get(socket.id!)).toBeUndefined();

        socket.close();
    });

    it("joining with an invalid payload returns BAD_PAYLOAD", async () => {
        const socket = await connectClient(server.url);
        const ack = await emitAck(socket, "GAME:JOIN", { gameId: "g1" });
        expect(ack).toEqual({
            ok: false,
            error: { code: "BAD_PAYLOAD", message: "Invalid GAME:JOIN payload" },
        });
        socket.close();
    });

    it("joining with a player that is not in the game returns PLAYER_NOT_FOUND", async () => {
        const gameId = await createGame();
        const socket = await connectClient(server.url);
        const ack = await emitAck(socket, "GAME:JOIN", { gameId, playerId: "Z9" });
        expect(ack.ok).toBe(false);
        expect(ack.error.code).toBe("PLAYER_NOT_FOUND");
        expect(ConnectionStore.get(socket.id!)).toBeUndefined();
        socket.close();
    });

    it("leaving with an invalid payload returns BAD_PAYLOAD", async () => {
        const socket = await connectClient(server.url);
        const ack = await emitAck(socket, "GAME:LEAVE", {});
        expect(ack).toEqual({
            ok: false,
            error: { code: "BAD_PAYLOAD", message: "Invalid GAME:LEAVE payload" },
        });
        socket.close();
    });
});
