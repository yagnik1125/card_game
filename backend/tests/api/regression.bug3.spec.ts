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
const del = (path: string) => request("DELETE", path);

describe("BUG-3 regression — DELETE /:gameId returns HTTP 200 with a body", () => {
    it("returns 200 with success flag and message (was a body-less 204)", async () => {
        const created = await post("/create", {
            numberOfRounds: 1,
            difficulty: "easy",
            mode: "SOLO",
        });
        expect(created.status).toBe(201);
        const gameId = created.body.data.gameId;

        const res = await del(`/${gameId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Game removed Successfully.");
    });

    it("game is actually removed afterwards", async () => {
        const created = await post("/create", {
            numberOfRounds: 1,
            difficulty: "easy",
            mode: "SOLO",
        });
        const gameId = created.body.data.gameId;

        await del(`/${gameId}`);
        const gone = await get(`/${gameId}`);
        expect(gone.status).toBe(404);
    });
});
