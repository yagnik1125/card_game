import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { ConnectionStore } from "../../src/websocket/ConnectionStore.js";
import { connectClient, emitAck } from "../helpers/wsClient.js";
import { resetSessionStore, startTestServer, TestServer } from "../helpers/server.js";

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

async function createGameViaRest(): Promise<string> {
    const response = await fetch(`${server.url}/api/games/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberOfRounds: 1, difficulty: "easy", mode: "SOLO" }),
    });
    const body = await response.json();
    expect(response.status).toBe(201);
    return body.data.gameId;
}

async function restGet(path: string): Promise<any> {
    const response = await fetch(`${server.url}/api/games${path}`);
    const body = await response.json();
    expect(response.status).toBe(200);
    return body.data;
}

describe("WS query commands return the same data as their REST endpoints", () => {
    it("GAME:GET_STATE matches GET /:gameId/state", async () => {
        const gameId = await createGameViaRest();
        const socket = await connectClient(server.url);
        const join: any = await emitAck(socket, "GAME:JOIN", { gameId, playerId: "P1" });
        expect(join.ok).toBe(true);

        const rest = await restGet(`/${gameId}/state`);
        const ws: any = await emitAck(socket, "GAME:GET_STATE", { gameId });

        expect(ws.ok).toBe(true);
        expect(ws.data).toEqual(rest);

        socket.close();
    });

    it("GAME:GET_TURN matches GET /:gameId/turn", async () => {
        const gameId = await createGameViaRest();
        const socket = await connectClient(server.url);
        const join: any = await emitAck(socket, "GAME:JOIN", { gameId, playerId: "P1" });
        expect(join.ok).toBe(true);

        const rest = await restGet(`/${gameId}/turn`);
        const ws: any = await emitAck(socket, "GAME:GET_TURN", { gameId });

        expect(ws.ok).toBe(true);
        expect(ws.data).toEqual(rest);

        socket.close();
    });

    it("GAME:GET_LEGAL_MOVES matches GET /:gameId/legal-moves/:playerId", async () => {
        const gameId = await createGameViaRest();
        const socket = await connectClient(server.url);
        const join: any = await emitAck(socket, "GAME:JOIN", { gameId, playerId: "P1" });
        expect(join.ok).toBe(true);

        const rest = await restGet(`/${gameId}/legal-moves/P1`);
        const ws: any = await emitAck(socket, "GAME:GET_LEGAL_MOVES", {
            gameId,
            playerId: "P1",
        });

        expect(ws.ok).toBe(true);
        expect(ws.data).toEqual(rest);
        expect(ws.data).toHaveLength(13);

        socket.close();
    });

    it("GAME:GET_HAND matches GET /:gameId/player/:playerId/hand", async () => {
        const gameId = await createGameViaRest();
        const socket = await connectClient(server.url);
        const join: any = await emitAck(socket, "GAME:JOIN", { gameId, playerId: "P1" });
        expect(join.ok).toBe(true);

        const rest = await restGet(`/${gameId}/player/P1/hand`);
        const ws: any = await emitAck(socket, "GAME:GET_HAND", {
            gameId,
            playerId: "P1",
        });

        expect(ws.ok).toBe(true);
        expect(ws.data).toEqual(rest);
        expect(ws.data.playerId).toBe("P1");
        expect(ws.data.cards).toHaveLength(13);

        socket.close();
    });
});
