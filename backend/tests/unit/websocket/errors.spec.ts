import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { GameSessionManager } from "../../../game-engine/src/session/GameSessionManager.js";
import { ConnectionStore } from "../../../src/websocket/ConnectionStore.js";
import { connectClient, emitAck, nextEvent } from "../../helpers/wsClient.js";
import { resetSessionStore, startTestServer, TestServer } from "../../helpers/server.js";
import { Socket } from "socket.io-client";

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

async function joinGame(socket: Socket, gameId: string): Promise<void> {
    const ack: any = await emitAck(socket, "GAME:JOIN", { gameId, playerId: "P1" });
    expect(ack.ok).toBe(true);
}

describe("WebSocket error paths — typed errors, never a crash (Phase 8)", () => {
    it("an unknown event yields UNKNOWN_EVENT ack + GAME_ERROR and keeps the socket alive", async () => {
        const socket: Socket = await connectClient(server.url);
        const errorEvent = nextEvent(socket, "GAME_ERROR");

        const ack = await emitAck(socket, "GAME:DOES_NOT_EXIST", { foo: 1 });
        expect(ack).toEqual({
            ok: false,
            error: { code: "UNKNOWN_EVENT", message: "Unknown event: GAME:DOES_NOT_EXIST" },
        });

        const errorPayload = await errorEvent;
        expect(errorPayload.code).toBe("UNKNOWN_EVENT");

        const ping = await emitAck(socket, "GAME:PING", {});
        expect(ping).toEqual({ ok: true, data: null });

        socket.close();
    });

    it("an unknown event without an ack callback emits GAME_ERROR and does not crash", async () => {
        const socket: Socket = await connectClient(server.url);
        const errorEvent = nextEvent(socket, "GAME_ERROR");

        socket.emit("GAME:WHATEVER", { hello: "world" });

        const errorPayload = await errorEvent;
        expect(errorPayload.code).toBe("UNKNOWN_EVENT");

        const ping = await emitAck(socket, "GAME:PING", {});
        expect(ping.ok).toBe(true);

        socket.close();
    });

    it("malformed payloads yield BAD_PAYLOAD acks for every command", async () => {
        const socket: Socket = await connectClient(server.url);
        const malformed: [string, any][] = [
            ["GAME:CREATE", { numberOfRounds: 1 }],
            ["GAME:PLAY_CARD", { gameId: "g" }],
            ["GAME:GET_STATE", {}],
            ["GAME:GET_TURN", {}],
            ["GAME:GET_LEGAL_MOVES", { gameId: "g" }],
            ["GAME:GET_HAND", { gameId: "g" }],
            ["GAME:REMOVE", {}],
            ["GAME:JOIN", { gameId: "g" }],
            ["GAME:LEAVE", {}],
        ];

        for (const [event, payload] of malformed) {
            const ack: any = await emitAck(socket, event, payload);
            expect(ack.ok).toBe(false);
            expect(ack.error.code).toBe("BAD_PAYLOAD");
        }

        const ping = await emitAck(socket, "GAME:PING", {});
        expect(ping.ok).toBe(true);

        socket.close();
    });

    it("queries against a non-existent game yield GAME_NOT_FOUND ack + GAME_ERROR", async () => {
        const socket: Socket = await connectClient(server.url);
        const errorEvent = nextEvent(socket, "GAME_ERROR");

        const ack: any = await emitAck(socket, "GAME:GET_LEGAL_MOVES", {
            gameId: "nope",
            playerId: "P1",
        });
        expect(ack.ok).toBe(false);
        expect(ack.error).toEqual({
            code: "GAME_NOT_FOUND",
            message: "Game not found",
            gameId: "nope",
        });

        const errorPayload = await errorEvent;
        expect(errorPayload.code).toBe("GAME_NOT_FOUND");
        expect(errorPayload.gameId).toBe("nope");

        socket.close();
    });

    it("an illegal card yields ILLEGAL_MOVE ack + GAME_ERROR", async () => {
        const gameId = await createGame();
        const socket: Socket = await connectClient(server.url);
        await joinGame(socket, gameId);
        const errorEvent = nextEvent(socket, "GAME_ERROR");

        const ack: any = await emitAck(socket, "GAME:PLAY_CARD", {
            gameId,
            playerId: "P1",
            cardId: "not-a-card",
        });
        expect(ack.ok).toBe(false);
        expect(ack.error.code).toBe("ILLEGAL_MOVE");

        const errorPayload = await errorEvent;
        expect(errorPayload.code).toBe("ILLEGAL_MOVE");

        socket.close();
    });

    it("playing on a completed game yields a typed error ack + GAME_ERROR and never crashes", async () => {
        const gameId = await createGame();
        const legalResponse = await fetch(
            `${server.url}/api/games/${gameId}/legal-moves/P1`
        );
        const legalBody = await legalResponse.json();
        const legalCardId = legalBody.data[0].id;

        const session = GameSessionManager.get(gameId);
        session.gameState!.completed = true;
        session.gameState!.turnState.currentPlayerId = "P2";
        GameSessionManager.save(session);

        const socket: Socket = await connectClient(server.url);
        await joinGame(socket, gameId);
        const errorEvent = nextEvent(socket, "GAME_ERROR");

        const ack: any = await emitAck(socket, "GAME:PLAY_CARD", {
            gameId,
            playerId: "P1",
            cardId: legalCardId,
        });
        expect(ack.ok).toBe(false);
        expect(ack.error.code).toBe("NOT_YOUR_TURN");

        const errorPayload = await errorEvent;
        expect(errorPayload.code).toBe("NOT_YOUR_TURN");

        const ping = await emitAck(socket, "GAME:PING", {});
        expect(ping.ok).toBe(true);

        socket.close();
    });
});
