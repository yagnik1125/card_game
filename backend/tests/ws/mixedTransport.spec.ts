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

async function rest(method: string, path: string, body?: any): Promise<any> {
    const response = await fetch(`${server.url}/api/games${path}`, {
        method,
        headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function createGameViaRest(overrides: any = {}): Promise<string> {
    const res = await rest("POST", "/create", {
        numberOfRounds: 1,
        difficulty: "easy",
        mode: "SOLO",
        ...overrides,
    });
    expect(res.status).toBe(201);
    return res.body.data.gameId;
}

async function joinViaWs(socket: Socket, gameId: string): Promise<void> {
    const ack: any = await emitAck(socket, "GAME:JOIN", { gameId, playerId: "P1" });
    expect(ack.ok).toBe(true);
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

describe("Mixed REST + WS transport on the same server (Phase 7)", () => {
    it("serves both transports on the same port and streams REST play-turn events to a WS watcher", async () => {
        expect(new URL(server.url).port).toBe(String(server.port));

        const gameId = await createGameViaRest();
        const socket: Socket = await connectClient(server.url);
        await joinViaWs(socket, gameId);

        const legalRes = await rest("GET", `/${gameId}/legal-moves/P1`);
        expect(legalRes.status).toBe(200);
        const cardId = legalRes.body.data[0].id;

        const playedPromise: Promise<any> = (async () => {
            const ev: any = await new Promise((resolve, reject) => {
                const timer = setTimeout(
                    () => reject(new Error("Timed out waiting for CARD_PLAYED")),
                    3000
                );
                socket.once("CARD_PLAYED", (payload: any) => {
                    clearTimeout(timer);
                    resolve(payload);
                });
            });
            return ev;
        })();
        const trickPromise: Promise<any> = (async () => {
            const ev: any = await new Promise((resolve, reject) => {
                const timer = setTimeout(
                    () => reject(new Error("Timed out waiting for TRICK_COMPLETED")),
                    3000
                );
                socket.once("TRICK_COMPLETED", (envelope: any) => {
                    clearTimeout(timer);
                    resolve(envelope);
                });
            });
            return ev;
        })();

        const turnRes = await rest("POST", "/play-turn", {
            gameId,
            playerId: "P1",
            cardId,
        });
        expect(turnRes.status).toBe(200);
        expect(turnRes.body.data.events).toBeDefined();
        expect(turnRes.body.data.snapshot).toBeDefined();

        const played = await playedPromise;
        expect(played.type).toBe("CARD_PLAYED");
        expect(played.payload.playerId).toBe("P1");
        expect(played.payload.cardId).toBe(cardId);

        const trick = await trickPromise;
        expect(trick.type).toBe("TRICK_COMPLETED");
        expect(trick.snapshot).toBeDefined();
        expect(trick.snapshot.gameId).toBe(gameId);

        socket.close();
    });

    it("a WS PLAY_CARD in a REST-created game keeps REST state consistent", async () => {
        const gameId = await createGameViaRest();
        const socket: Socket = await connectClient(server.url);
        await joinViaWs(socket, gameId);

        const legalAck: any = await emitAck(socket, "GAME:GET_LEGAL_MOVES", {
            gameId,
            playerId: "P1",
        });
        expect(legalAck.ok).toBe(true);
        const cardId = legalAck.data[0].id;

        const playAck: any = await emitAck(socket, "GAME:PLAY_CARD", {
            gameId,
            playerId: "P1",
            cardId,
        });
        expect(playAck.ok).toBe(true);

        await waitForHumanTurn(socket, gameId);

        const stateRes = await rest("GET", `/${gameId}/state`);
        expect(stateRes.status).toBe(200);
        expect(stateRes.body.data.completed).toBe(false);
        expect(stateRes.body.data.currentPlayerId).toBe("P1");

        const handRes = await rest("GET", `/${gameId}/player/P1/hand`);
        expect(handRes.status).toBe(200);
        expect(handRes.body.data.cards).toHaveLength(12);
        expect(handRes.body.data.cards.some((c: any) => c.id === cardId)).toBe(false);

        const nextLegal = await rest("GET", `/${gameId}/legal-moves/P1`);
        expect(nextLegal.status).toBe(200);
        const turnRes = await rest("POST", "/play-turn", {
            gameId,
            playerId: "P1",
            cardId: nextLegal.body.data[0].id,
        });
        expect(turnRes.status).toBe(200);

        socket.close();
    });

    it("serializes REST play-turn against an in-flight WS bot chain (REST gets 409)", async () => {
        const gameId = await createGameViaRest();
        const socket: Socket = await connectClient(server.url);
        await joinViaWs(socket, gameId);

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

        const busy = await rest("POST", "/play-turn", {
            gameId,
            playerId: "P1",
            cardId: legalAck.data[0].id,
        });
        expect(busy.status).toBe(409);
        expect(busy.body).toEqual({ success: false, message: "Game is busy" });

        await waitForHumanTurn(socket, gameId);

        const nextLegal = await rest("GET", `/${gameId}/legal-moves/P1`);
        const ok = await rest("POST", "/play-turn", {
            gameId,
            playerId: "P1",
            cardId: nextLegal.body.data[0].id,
        });
        expect(ok.status).toBe(200);
        expect(ok.body.success).toBe(true);

        socket.close();
    });
});
