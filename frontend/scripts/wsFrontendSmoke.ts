/**
 * Frontend WebSocket smoke test.
 *
 * Drives the real frontend client stack (socketClient, protocol types, env
 * config) against a running backend: connect, GAME:CREATE, GAME:JOIN, then
 * play cards until the match completes. Verifies a MATCH_COMPLETED event is
 * delivered with the mode-appropriate winner field (winnerPlayerId for SOLO,
 * winnerTeamId for TEAMS_2V2). Once per variant a mid-game reload is simulated
 * (disconnect + reconnect + re-join) and the board must catch up via resync.
 *
 * Usage: npm run ws:smoke:game             (backend must be running on PORT,
 *        npm run ws:smoke:game -- TEAMS_2V2   default 5000)
 *
 * By default both SOLO and TEAMS_2V2 variants are exercised.
 */

import { connect, disconnect, emitWithAck, getSocket } from "../src/ws/client/socketClient";
import { getConnectionStatus, onConnectionChange } from "../src/ws/client/connection";
import { WS_URL } from "../src/config/env";
import type { GameView } from "../src/ws/dto/gameView";

const OVERALL_TIMEOUT_MS = 120000;

type GameMode = "SOLO" | "TEAMS_2V2";

interface MatchCompletedEnvelope {
    type: string;
    payload: {
        winnerPlayerId?: string | null;
        winnerTeamId?: string | null;
    };
}

function fail(message: string): never {
    console.error(`[ws-smoke] FAIL: ${message}`);
    process.exit(1);
}

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        fail(message);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForConnection(timeoutMs = 10000): Promise<void> {
    if (getConnectionStatus() === "connected") {
        return;
    }
    await new Promise<void>((resolve, reject) => {
        let off = () => {};
        const timer = setTimeout(() => {
            off();
            reject(new Error(`Not connected after ${timeoutMs}ms`));
        }, timeoutMs);
        off = onConnectionChange((status) => {
            if (status === "connected") {
                clearTimeout(timer);
                resolve();
            }
        });
    });
}

async function waitForHumanTurn(gameId: string, timeoutMs = 30000): Promise<GameView> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const stateAck = await emitWithAck<GameView>("GAME:GET_STATE", { gameId });
        assert(stateAck.ok, `GAME:GET_STATE failed: ${JSON.stringify(stateAck)}`);
        const view = stateAck.data;
        if (view?.completed || view?.currentPlayerId === "P1") {
            return view ?? fail("GAME:GET_STATE returned no data");
        }
        await sleep(25);
    }
    return fail(`Timed out waiting for the human turn (${timeoutMs}ms)`);
}

async function runVariant(mode: GameMode): Promise<void> {
    console.log(`[ws-smoke] Connecting to ${WS_URL} ...`);
    connect();
    await waitForConnection();
    console.log("[ws-smoke] Connected");

    const socket = getSocket();
    let matchCompleted: MatchCompletedEnvelope | null = null;
    const onMatchCompleted = (envelope: unknown): void => {
        matchCompleted = envelope as MatchCompletedEnvelope;
    };
    socket.on("MATCH_COMPLETED", onMatchCompleted);

    const createAck = await emitWithAck<{ gameId: string }>("GAME:CREATE", {
        numberOfRounds: 2,
        difficulty: "easy",
        mode,
    });
    assert(createAck.ok, `GAME:CREATE (${mode}) failed: ${JSON.stringify(createAck)}`);
    const gameId = createAck.data?.gameId ?? "";
    assert(gameId.length > 0, `GAME:CREATE (${mode}) returned no gameId`);
    console.log(`[ws-smoke] Created ${mode} game ${gameId}`);

    const joinAck = await emitWithAck("GAME:JOIN", { gameId, playerId: "P1" });
    assert(joinAck.ok, `GAME:JOIN failed: ${JSON.stringify(joinAck)}`);

    const deadline = Date.now() + OVERALL_TIMEOUT_MS;
    let plays = 0;
    let guard = 0;
    while (guard++ < 1000 && Date.now() < deadline) {
        const view = await waitForHumanTurn(gameId);
        if (view.completed) {
            break;
        }

        const legalAck = await emitWithAck<{ id: string }[]>("GAME:GET_LEGAL_MOVES", {
            gameId,
            playerId: "P1",
        });
        assert(legalAck.ok, `GAME:GET_LEGAL_MOVES failed: ${JSON.stringify(legalAck)}`);
        const legal = legalAck.data ?? [];
        assert(legal.length > 0, "No legal moves for P1");

        const playAck = await emitWithAck("GAME:PLAY_CARD", {
            gameId,
            playerId: "P1",
            cardId: legal[0].id,
        });
        assert(playAck.ok, `GAME:PLAY_CARD failed: ${JSON.stringify(playAck)}`);
        plays += 1;
        if (plays % 20 === 0) {
            console.log(`[ws-smoke] ${plays} plays so far`);
        }

        if (plays === 1) {
            // Mid-game reload: drop the transport and reconnect exactly like a
            // fresh page load. The client must re-join and catch up via
            // GAME:GET_STATE/GAME_STATE instead of losing the board.
            const before = await emitWithAck<GameView>("GAME:GET_STATE", {
                gameId,
            });
            assert(before.ok, "GAME:GET_STATE before reload failed");
            const roundBefore = before.data?.roundNumber ?? 0;
            console.log(
                `[ws-smoke] ${mode}: simulating a mid-game reload (round ${roundBefore})`
            );

            socket.off("MATCH_COMPLETED", onMatchCompleted);
            disconnect();
            connect();
            await waitForConnection();
            socket.on("MATCH_COMPLETED", onMatchCompleted);

            const rejoin = await emitWithAck("GAME:JOIN", {
                gameId,
                playerId: "P1",
            });
            assert(
                rejoin.ok,
                `GAME:JOIN after reload failed: ${JSON.stringify(rejoin)}`
            );

            const after = await emitWithAck<GameView>("GAME:GET_STATE", {
                gameId,
            });
            assert(after.ok, "GAME:GET_STATE after reload failed");
            assert(
                (after.data?.roundNumber ?? 0) >= roundBefore,
                `Board did not catch up after reload (round ${roundBefore} -> ${after.data?.roundNumber})`
            );
            console.log("[ws-smoke] Resynced after reload");
        }
    }

    assert(plays > 0, "No cards were played");
    const completed: MatchCompletedEnvelope = matchCompleted ?? fail(
        `No MATCH_COMPLETED event received for ${mode}`
    );

    if (mode === "TEAMS_2V2") {
        assert(
            typeof completed.payload?.winnerTeamId === "string" &&
                completed.payload.winnerTeamId.length > 0,
            `MATCH_COMPLETED for TEAMS_2V2 missing winnerTeamId: ${JSON.stringify(completed)}`
        );
        console.log(
            `[ws-smoke] ${mode} match completed after ${plays} plays; ` +
                `winnerTeam=${completed.payload.winnerTeamId}`
        );
    } else {
        assert(
            typeof completed.payload?.winnerPlayerId === "string" &&
                completed.payload.winnerPlayerId.length > 0,
            `MATCH_COMPLETED for SOLO missing winnerPlayerId: ${JSON.stringify(completed)}`
        );
        console.log(
            `[ws-smoke] ${mode} match completed after ${plays} plays; ` +
                `winner=${completed.payload.winnerPlayerId}`
        );
    }

    socket.off("MATCH_COMPLETED", onMatchCompleted);
    disconnect();
    console.log(`[ws-smoke] ${mode} variant PASS`);
}

async function main(): Promise<void> {
    const requested = process.argv[2] as GameMode | undefined;
    if (requested && requested !== "SOLO" && requested !== "TEAMS_2V2") {
        fail(`Unknown mode "${requested}" (expected SOLO or TEAMS_2V2)`);
    }
    const modes: GameMode[] = requested ? [requested] : ["SOLO", "TEAMS_2V2"];
    for (const mode of modes) {
        await runVariant(mode);
    }
    console.log("[ws-smoke] PASS");
    process.exit(0);
}

main().catch((error: unknown) => {
    console.error(`[ws-smoke] FAIL: ${(error as Error).message}`);
    process.exit(1);
});
