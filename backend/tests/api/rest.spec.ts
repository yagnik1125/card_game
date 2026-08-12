import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
    resetSessionStore,
    startTestServer,
    TestServer,
} from "../helpers/server.js";
import { connectClient, emitAck, sleep } from "../helpers/wsClient.js";

process.env.BOT_DELAY_MS = "50";

let server: TestServer;

beforeAll(async () => {
    server = await startTestServer();
});

afterEach(() => {
    resetSessionStore();
});

afterAll(async () => {
    await server.close();
});

async function request(
    method: string,
    path: string,
    body?: any
): Promise<{ status: number; body: any }> {
    const response = await fetch(`${server.url}/api/games${path}`, {
        method,
        headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    return {
        status: response.status,
        body: text ? JSON.parse(text) : null,
    };
}

const post = (path: string, body: any) => request("POST", path, body);
const get = (path: string) => request("GET", path);
const del = (path: string) => request("DELETE", path);

async function createGame(overrides: any = {}): Promise<any> {
    const res = await post("/create", {
        numberOfRounds: 2,
        difficulty: "easy",
        mode: "SOLO",
        ...overrides,
    });
    expect(res.status).toBe(201);
    return res.body.data;
}

describe("REST API regression — existing endpoints keep working", () => {
    it("GET /health returns success", async () => {
        const res = await get("/health");
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("POST /create creates a game with 1 human + 3 bots", async () => {
        const session = await createGame();
        expect(session.gameId).toBeTruthy();
        expect(session.match.mode).toBe("SOLO");
        expect(session.match.players).toHaveLength(4);
        expect(session.match.players.filter((p: any) => p.isBot)).toHaveLength(3);
        expect(session.gameState.turnState.currentPlayerId).toBe("P1");
    });

    it("GET /:gameId returns the raw session", async () => {
        const session = await createGame();
        const res = await get(`/${session.gameId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.gameId).toBe(session.gameId);
    });

    it("GET /:gameId returns 404 for an unknown game", async () => {
        const res = await get("/does-not-exist");
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    it("GET /:gameId/state returns the mapped game state", async () => {
        const session = await createGame();
        const res = await get(`/${session.gameId}/state`);
        expect(res.status).toBe(200);
        const state = res.body.data;
        expect(state.gameId).toBe(session.gameId);
        expect(state.completed).toBe(false);
        expect(state.currentPlayerId).toBe("P1");
        expect(state.turnNumber).toBe(1);
        expect(state.roundNumber).toBe(1);
        expect(state.trumpSuit).toBeNull();
        expect(state.players).toHaveLength(4);
        expect(state.currentTrick.trickNumber).toBe(1);
    });

    it("GET /:gameId/view returns human hand + legal moves only for P1", async () => {
        const session = await createGame();
        const res = await get(`/${session.gameId}/view`);
        expect(res.status).toBe(200);
        const view = res.body.data;
        expect(view.currentPlayerId).toBe("P1");
        expect(view.players).toHaveLength(4);
        const human = view.players.find((p: any) => p.id === "P1");
        expect(human.hand).toHaveLength(13);
        expect(view.legalMoves).toHaveLength(13);
        view.players
            .filter((p: any) => p.id !== "P1")
            .forEach((p: any) => expect(p.hand).toBeUndefined());
    });

    it("GET /:gameId/turn returns whose turn it is", async () => {
        const session = await createGame();
        const res = await get(`/${session.gameId}/turn`);
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual({ currentPlayerId: "P1", turnNumber: 1 });
    });

    it("GET /:gameId/legal-moves/:playerId returns the full opening hand", async () => {
        const session = await createGame();
        const res = await get(`/${session.gameId}/legal-moves/P1`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(13);
    });

    it("GET /:gameId/player/:playerId/hand returns the player's cards", async () => {
        const session = await createGame();
        const res = await get(`/${session.gameId}/player/P1/hand`);
        expect(res.status).toBe(200);
        expect(res.body.data.playerId).toBe("P1");
        expect(res.body.data.cards).toHaveLength(13);
    });

    it("POST /play-card plays a single card and advances the turn", async () => {
        const session = await createGame();
        const legal = await get(`/${session.gameId}/legal-moves/P1`);
        const cardId = legal.body.data[0].id;

        const res = await post("/play-card", {
            gameId: session.gameId,
            playerId: "P1",
            cardId,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.currentTrick.plays).toHaveLength(1);
        expect(res.body.data.currentPlayerId).not.toBe("P1");
    });

    it("POST /play-card rejects an invalid card", async () => {
        const session = await createGame();
        const res = await post("/play-card", {
            gameId: session.gameId,
            playerId: "P1",
            cardId: "not-a-card",
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it("POST /play-turn processes human + bots and returns events + snapshot", async () => {
        const session = await createGame();
        const legal = await get(`/${session.gameId}/legal-moves/P1`);
        const cardId = legal.body.data[0].id;

        const res = await post("/play-turn", {
            gameId: session.gameId,
            playerId: "P1",
            cardId,
        });
        expect(res.status).toBe(200);
        expect(res.body.data.events.length).toBeGreaterThan(0);
        expect(
            res.body.data.events.some(
                (e: any) => e.type === "CARD_PLAYED" || e.type === "BOT_PLAY"
            )
        ).toBe(true);
        expect(res.body.data.snapshot.completed).toBe(false);
        expect(res.body.data.snapshot.roundNumber).toBe(1);
        expect(res.body.data.snapshot.currentPlayerId).toBe("P1");
    });

    it("POST /play-turn rejects an illegal move", async () => {
        const session = await createGame();
        const res = await post("/play-turn", {
            gameId: session.gameId,
            playerId: "P1",
            cardId: "not-a-card",
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it("DELETE /:gameId removes the game and returns 200 with a message", async () => {
        const session = await createGame();
        const res = await del(`/${session.gameId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBeTruthy();

        const gone = await get(`/${session.gameId}`);
        expect(gone.status).toBe(404);
    });

    it("mixed REST play-turn and WS PLAY_CARD never corrupt turn order", async () => {
        const session = await createGame();
        const socket = await connectClient(server.url);
        const join: any = await emitAck(socket, "GAME:JOIN", {
            gameId: session.gameId,
            playerId: "P1",
        });
        expect(join).toEqual({ ok: true, data: { gameId: session.gameId } });

        const wsLegal: any = await emitAck(socket, "GAME:GET_LEGAL_MOVES", {
            gameId: session.gameId,
            playerId: "P1",
        });
        expect(wsLegal.ok).toBe(true);

        const wsPlay: any = await emitAck(socket, "GAME:PLAY_CARD", {
            gameId: session.gameId,
            playerId: "P1",
            cardId: wsLegal.data[0].id,
        });
        expect(wsPlay.ok).toBe(true);
        expect(wsPlay.data.events.length).toBeGreaterThan(0);
        expect(wsPlay.data.snapshot).toBeDefined();

        for (let i = 0; i < 300; i++) {
            const turn = await get(`/${session.gameId}/turn`);
            const current = turn.body?.data?.currentPlayerId;
            if (current === "P1") {
                break;
            }
            await sleep(10);
        }

        const restTurn = await get(`/${session.gameId}/turn`);
        expect(restTurn.status).toBe(200);
        expect(restTurn.body.data.currentPlayerId).toBe("P1");

        const restLegal = await get(`/${session.gameId}/legal-moves/P1`);
        const restPlay = await post("/play-turn", {
            gameId: session.gameId,
            playerId: "P1",
            cardId: restLegal.body.data[0].id,
        });
        expect(restPlay.status).toBe(200);

        const wsTurn: any = await emitAck(socket, "GAME:GET_TURN", {
            gameId: session.gameId,
        });
        expect(wsTurn.ok).toBe(true);
        expect(wsTurn.data.currentPlayerId).toBe("P1");

        const view = await get(`/${session.gameId}/view`);
        expect(view.status).toBe(200);
        const human = view.body.data.players.find((p: any) => p.id === "P1");
        expect(human.cardsRemaining).toBe(11);

        socket.close();
    });
});
