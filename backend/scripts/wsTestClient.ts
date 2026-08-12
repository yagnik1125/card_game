import { io, Socket } from "socket.io-client";

const PORT = process.env.PORT || 5000;
const URL = `http://localhost:${PORT}`;
const COMMAND_TIMEOUT_MS = 5000;
const OVERALL_TIMEOUT_MS = 120000;

let failed = false;

function fail(message: string): never {
    failed = true;
    console.error(`[ws-test] FAIL: ${message}`);
    process.exit(1);
}

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        fail(message);
    }
}

function emit(
    socket: Socket,
    event: string,
    payload?: any
): Promise<any> {
    return new Promise((resolve) => {
        const handle = (err: Error | null, ack: any) => {
            if (err) {
                resolve({ ok: false, error: { code: "TIMEOUT", message: err.message } });
                return;
            }
            resolve(ack);
        };
        if (payload === undefined) {
            socket.timeout(COMMAND_TIMEOUT_MS).emit(event, handle);
        } else {
            socket.timeout(COMMAND_TIMEOUT_MS).emit(event, payload, handle);
        }
    });
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHumanTurn(socket: Socket, gameId: string): Promise<void> {
    for (let i = 0; i < 600; i++) {
        const stateAck: any = await emit(socket, "GAME:GET_STATE", { gameId });
        if (!stateAck.ok) {
            fail(`GAME:GET_STATE failed: ${JSON.stringify(stateAck)}`);
        }
        if (stateAck.data.completed || stateAck.data.currentPlayerId === "P1") {
            return;
        }
        await sleep(25);
    }
    fail("Timed out waiting for the bot chain to finish");
}

async function runWsOnlyMatch(): Promise<void> {
    console.log(`[ws-test] Connecting to ${URL} ...`);

    const socket: Socket = await new Promise((resolve, reject) => {
        const client = io(URL, {
            transports: ["websocket"],
            reconnection: false,
            timeout: COMMAND_TIMEOUT_MS,
        });
        client.once("connect", () => resolve(client));
        client.once("connect_error", (err) => reject(err));
    });

    console.log(`[ws-test] Connected as ${socket.id}`);

    let matchCompleted: any;
    socket.on("MATCH_COMPLETED", (envelope: any) => {
        matchCompleted = envelope;
    });

    const createAck: any = await emit(socket, "GAME:CREATE", {
        numberOfRounds: 2,
        difficulty: "easy",
        mode: "SOLO",
    });
    assert(createAck.ok, `GAME:CREATE failed: ${JSON.stringify(createAck)}`);
    const gameId: string = createAck.data.gameId;
    console.log(`[ws-test] Created game ${gameId}`);

    const joinAck: any = await emit(socket, "GAME:JOIN", { gameId, playerId: "P1" });
    assert(joinAck.ok, `GAME:JOIN failed: ${JSON.stringify(joinAck)}`);

    let plays = 0;
    let guard = 0;
    while (guard++ < 120) {
        const stateAck: any = await emit(socket, "GAME:GET_STATE", { gameId });
        assert(stateAck.ok, `GAME:GET_STATE failed: ${JSON.stringify(stateAck)}`);
        if (stateAck.data.completed) {
            break;
        }

        const legalAck: any = await emit(socket, "GAME:GET_LEGAL_MOVES", {
            gameId,
            playerId: "P1",
        });
        assert(legalAck.ok, `GAME:GET_LEGAL_MOVES failed: ${JSON.stringify(legalAck)}`);
        assert(
            legalAck.data.length > 0,
            "No legal moves returned for P1 while the game is not completed"
        );

        const playAck: any = await emit(socket, "GAME:PLAY_CARD", {
            gameId,
            playerId: "P1",
            cardId: legalAck.data[0].id,
        });
        assert(playAck.ok, `GAME:PLAY_CARD failed: ${JSON.stringify(playAck)}`);
        assert(
            playAck.data.events.some((e: any) => e.type === "CARD_PLAYED"),
            "PLAY_CARD ack did not include a CARD_PLAYED event"
        );
        assert(playAck.data.snapshot.gameId === gameId, "PLAY_CARD snapshot mismatch");
        plays += 1;
        await waitForHumanTurn(socket, gameId);
    }

    const finalAck: any = await emit(socket, "GAME:GET_STATE", { gameId });
    assert(finalAck.ok, `final GAME:GET_STATE failed: ${JSON.stringify(finalAck)}`);
    assert(finalAck.data.completed, "Game did not reach a completed state");

    assert(matchCompleted, "MATCH_COMPLETED event was never received");
    assert(matchCompleted.snapshot?.completed === true, "MATCH_COMPLETED snapshot not completed");
    assert(
        typeof matchCompleted.payload?.winnerPlayerId === "string" &&
            matchCompleted.payload.winnerPlayerId.length > 0,
        "MATCH_COMPLETED missing winnerPlayerId"
    );

    console.log(`[ws-test] Match complete after ${plays} human plays.`);
    console.log(`[ws-test] Winner: ${matchCompleted.payload.winnerPlayerId}`);
    console.log("[ws-test] PASS: WS-only match with assertions completed successfully.");

    socket.close();
}

const watchdog = setTimeout(() => {
    fail(`Timed out after ${OVERALL_TIMEOUT_MS}ms`);
}, OVERALL_TIMEOUT_MS);

runWsOnlyMatch()
    .then(() => {
        clearTimeout(watchdog);
        setTimeout(() => process.exit(failed ? 1 : 0), 150);
    })
    .catch((err) => {
        clearTimeout(watchdog);
        console.error("[ws-test] FAIL:", err instanceof Error ? err.message : err);
        process.exit(1);
    });
