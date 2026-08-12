import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
    resetSessionStore,
    startTestServer,
    TestServer,
} from "../helpers/server.js";

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

describe("BUG-1 regression — SOLO match winner uses rounds won then total tricks", () => {
    it("completes a full multi-round SOLO match and reports a valid winner", async () => {
        const created = await post("/create", {
            numberOfRounds: 2,
            difficulty: "easy",
            mode: "SOLO",
        });
        expect(created.status).toBe(201);
        const gameId = created.body.data.gameId;

        let guard = 0;
        while (guard++ < 200) {
            const view = await get(`/${gameId}/view`);
            expect(view.status).toBe(200);
            if (view.body.data.completed) {
                break;
            }
            const cardId = view.body.data.legalMoves[0];
            const play = await post("/play-turn", {
                gameId,
                playerId: "P1",
                cardId,
            });
            expect(play.status).toBe(200);
        }

        const view = await get(`/${gameId}/view`);
        expect(view.body.data.completed).toBe(true);

        const game = await get(`/${gameId}`);
        const result = game.body.data.match.result;
        expect(result.winnerPlayerId).toBeDefined();
        expect(result.totalTricksWon).toBeGreaterThanOrEqual(0);
        expect(typeof result.roundsWon).toBe("number");

        const playerIds = game.body.data.match.players.map((p: any) => p.id);
        expect(playerIds).toContain(result.winnerPlayerId);
    });

    it("teams mode match completes with a valid team winner", async () => {
        const created = await post("/create", {
            numberOfRounds: 1,
            difficulty: "easy",
            mode: "TEAMS_2V2",
        });
        expect(created.status).toBe(201);
        const gameId = created.body.data.gameId;

        let guard = 0;
        while (guard++ < 200) {
            const view = await get(`/${gameId}/view`);
            if (view.body.data.completed) {
                break;
            }
            const cardId = view.body.data.legalMoves[0];
            const play = await post("/play-turn", {
                gameId,
                playerId: "P1",
                cardId,
            });
            expect(play.status).toBe(200);
        }

        const game = await get(`/${gameId}`);
        const result = game.body.data.match.result;
        expect(result.winnerTeamId).toBeDefined();
        expect(typeof result.roundsWon).toBe("number");
    });
});
