import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { GameGateway } from "../../src/websocket/GameGateway.js";
import { ConnectionStore } from "../../src/websocket/ConnectionStore.js";
import { connectClient, emitAck, expectNoEvent, nextEvent } from "../helpers/wsClient.js";
import { resetSessionStore, startTestServer, TestServer } from "../helpers/server.js";
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

async function joinGame(
    socket: Socket,
    gameId: string,
    playerId = "P1"
): Promise<void> {
    const joined = nextEvent(socket, "GAME_JOINED");
    const ack = await emitAck(socket, "GAME:JOIN", { gameId, playerId });
    expect(ack).toEqual({ ok: true, data: { gameId } });
    const broadcast = await joined;
    expect(broadcast.gameId).toBe(gameId);
    expect(broadcast.playerId).toBe(playerId);
    expect(broadcast.socketId).toBe(socket.id);
}

describe("WebSocket rooms & player presence", () => {
    it("GAME:JOIN acks and broadcasts GAME_JOINED to the room", async () => {
        const gameId = await createGame();
        const socket = await connectClient(server.url);
        await joinGame(socket, gameId);
        expect(ConnectionStore.get(socket.id!)).toEqual({
            socketId: socket.id,
            gameId,
            playerId: "P1",
        });
        socket.close();
    });

    it("room members receive broadcasts; non-members do not", async () => {
        const gameId = await createGame();
        const member = await connectClient(server.url);
        const outsider = await connectClient(server.url);
        await joinGame(member, gameId);

        const memberGets = nextEvent(member, "TEST_EVENT");
        const outsiderMisses = expectNoEvent(outsider, "TEST_EVENT");
        GameGateway.emitToGame(gameId, "TEST_EVENT", { n: 1 });

        await expect(memberGets).resolves.toEqual({ n: 1 });
        await outsiderMisses;

        member.close();
        outsider.close();
    });

    it("GAME:LEAVE removes membership and notifies the room", async () => {
        const gameId = await createGame();
        const leaver = await connectClient(server.url);
        const watcher = await connectClient(server.url);
        await joinGame(leaver, gameId, "P1");
        await joinGame(watcher, gameId, "P2");

        const left = nextEvent(watcher, "GAME_LEFT");
        const ack = await emitAck(leaver, "GAME:LEAVE", { gameId });
        expect(ack).toEqual({ ok: true, data: null });
        const leftPayload = await left;
        expect(leftPayload.gameId).toBe(gameId);
        expect(leftPayload.playerId).toBe("P1");
        expect(leftPayload.socketId).toBe(leaver.id);
        expect(ConnectionStore.get(leaver.id!)).toBeUndefined();

        const watcherGets = nextEvent(watcher, "TEST_EVENT");
        const leaverMisses = expectNoEvent(leaver, "TEST_EVENT");
        GameGateway.emitToGame(gameId, "TEST_EVENT", { n: 2 });
        await expect(watcherGets).resolves.toEqual({ n: 2 });
        await leaverMisses;

        leaver.close();
        watcher.close();
    });

    it("joining a second game moves the socket to the new room", async () => {
        const firstGame = await createGame();
        const secondGame = await createGame();
        const socket = await connectClient(server.url);
        const watcher = await connectClient(server.url);
        await joinGame(socket, firstGame);
        await joinGame(watcher, firstGame, "P2");
        await joinGame(socket, secondGame);

        expect(ConnectionStore.get(socket.id!)?.gameId).toBe(secondGame);

        const oldRoomWatcherGets = nextEvent(watcher, "ROOM_ONE");
        const movedSocketMisses = expectNoEvent(socket, "ROOM_ONE");
        GameGateway.emitToGame(firstGame, "ROOM_ONE", { n: 1 });
        await expect(oldRoomWatcherGets).resolves.toEqual({ n: 1 });
        await movedSocketMisses;

        const newRoomGets = nextEvent(socket, "ROOM_TWO");
        const watcherMisses = expectNoEvent(watcher, "ROOM_TWO");
        GameGateway.emitToGame(secondGame, "ROOM_TWO", { n: 2 });
        await expect(newRoomGets).resolves.toEqual({ n: 2 });
        await watcherMisses;

        socket.close();
        watcher.close();
    });

    it("disconnect notifies the room with GAME_LEFT", async () => {
        const gameId = await createGame();
        const leaving = await connectClient(server.url);
        const watcher = await connectClient(server.url);
        await joinGame(leaving, gameId, "P1");
        await joinGame(watcher, gameId, "P2");

        const leavingId = leaving.id!;
        const left = nextEvent(watcher, "GAME_LEFT");
        leaving.close();
        const leftPayload = await left;
        expect(leftPayload.gameId).toBe(gameId);
        expect(leftPayload.playerId).toBe("P1");
        expect(leftPayload.socketId).toBe(leavingId);

        watcher.close();
    });
});
