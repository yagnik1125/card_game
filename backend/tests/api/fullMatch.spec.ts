import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
    resetSessionStore,
    startTestServer,
    TestServer,
} from "../helpers/server.js";
import { expectedSoloWinner, expectedTeamWinner } from "../helpers/engine.js";

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

interface FullMatchResult {
    gameId: string;
    finalSession: any;
    allEvents: any[];
    lastSnapshot: any;
}

async function playFullMatchViaRest(
    numberOfRounds: number,
    mode: "SOLO" | "TEAMS_2V2"
): Promise<FullMatchResult> {
    const created = await post("/create", {
        numberOfRounds,
        difficulty: "easy",
        mode,
    });
    expect(created.status).toBe(201);
    const gameId = created.body.data.gameId;

    const allEvents: any[] = [];
    let lastSnapshot: any;
    let completed = false;
    let guard = 0;

    while (guard++ < 300 && !completed) {
        const state = await get(`/${gameId}/state`);
        expect(state.status).toBe(200);
        if (state.body.data.completed) {
            completed = true;
            break;
        }

        const legal = await get(`/${gameId}/legal-moves/P1`);
        expect(legal.status).toBe(200);
        expect(legal.body.data.length).toBeGreaterThan(0);

        const turn = await post(`/play-turn`, {
            gameId,
            playerId: "P1",
            cardId: legal.body.data[0].id,
        });
        expect(turn.status).toBe(200);
        expect(turn.body.success).toBe(true);
        expect(turn.body.data.events).toBeDefined();
        expect(turn.body.data.snapshot).toBeDefined();
        expect(turn.body.data.events.length).toBeGreaterThan(0);
        expect(
            turn.body.data.events.some((e: any) => e.type === "CARD_PLAYED")
        ).toBe(true);
        allEvents.push(...turn.body.data.events);
        lastSnapshot = turn.body.data.snapshot;
    }

    expect(completed).toBe(true);
    expect(lastSnapshot.completed).toBe(true);

    const finalState = await get(`/${gameId}/state`);
    expect(finalState.status).toBe(200);
    expect(finalState.body.data.completed).toBe(true);

    const raw = await get(`/${gameId}`);
    expect(raw.status).toBe(200);
    const finalSession = raw.body.data;

    return { gameId, finalSession, allEvents, lastSnapshot };
}

function soloExpectedWinner(players: any[]): string {
    return players.reduce((best, current) => {
        const better =
            current.stats.roundsWon > best.stats.roundsWon ||
            (current.stats.roundsWon === best.stats.roundsWon &&
                current.stats.totalTricksWon > best.stats.totalTricksWon);
        return better ? current : best;
    }).id;
}

function teamExpectedWinner(teams: any[]): string {
    return teams.reduce((best, current) => {
        const better =
            current.roundsWon > best.roundsWon ||
            (current.roundsWon === best.roundsWon &&
                current.totalTricksWon > best.totalTricksWon);
        return better ? current : best;
    }).id;
}

describe("REST-only full matches — REST play-turn drives a complete game (Phase 7)", () => {
    it("completes a full SOLO match via REST; winner matches engine rules (rounds → tricks)", async () => {
        const { finalSession, allEvents, lastSnapshot } = await playFullMatchViaRest(2, "SOLO");

        expect(finalSession.match.state.isCompleted).toBe(true);
        expect(finalSession.match.result).toBeDefined();

        const expectedWinner = expectedSoloWinner(finalSession.match.players);
        expect(finalSession.match.result.winnerPlayerId).toBe(expectedWinner);

        expect(
            allEvents.filter((e: any) => e.type === "ROUND_COMPLETED").length
        ).toBe(1);
        expect(allEvents.some((e: any) => e.type === "BOT_PLAY")).toBe(true);
        expect(allEvents.some((e: any) => e.type === "TRICK_COMPLETED")).toBe(true);

        const matchEvent = allEvents.find((e: any) => e.type === "MATCH_COMPLETED");
        expect(matchEvent).toBeDefined();
        expect(matchEvent.winner).toBe(finalSession.match.result.winnerPlayerId);
        expect(lastSnapshot.gameId).toBe(finalSession.gameId);
    });

    it("completes a full TEAMS_2V2 match via REST; winner team matches engine rules", async () => {
        const { finalSession, allEvents } = await playFullMatchViaRest(2, "TEAMS_2V2");

        expect(finalSession.match.state.isCompleted).toBe(true);
        expect(finalSession.match.result).toBeDefined();

        const expectedTeam = expectedTeamWinner(finalSession.match.teams);
        expect(finalSession.match.result.winnerTeamId).toBe(expectedTeam);

        expect(
            allEvents.filter((e: any) => e.type === "ROUND_COMPLETED").length
        ).toBe(1);
        const matchEvent = allEvents.find((e: any) => e.type === "MATCH_COMPLETED");
        expect(matchEvent).toBeDefined();
        expect(matchEvent.winnerTeam).toBe(finalSession.match.result.winnerTeamId);
    });
});
