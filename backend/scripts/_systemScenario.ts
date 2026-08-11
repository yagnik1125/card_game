import { io, Socket } from "socket.io-client";

const URL = "http://localhost:5000";
const TIMEOUT_MS = 8000;

let checks = 0;
let failures = 0;

function check(name: string, ok: boolean, detail?: unknown): void {
    checks += 1;
    if (ok) {
        console.log(`  [PASS] ${name}`);
    } else {
        failures += 1;
        console.error(`  [FAIL] ${name}${detail !== undefined ? ` -> ${JSON.stringify(detail)}` : ""}`);
    }
}

function fail(name: string, detail?: unknown): never {
    check(name, false, detail);
    throw new Error(`scenario failed: ${name}`);
}

function emit(socket: Socket, event: string, payload?: any): Promise<any> {
    return new Promise((resolve) => {
        const handle = (err: Error | null, ack: any) => {
            if (err) {
                resolve({ ok: false, error: { code: "TIMEOUT", message: err.message } });
                return;
            }
            resolve(ack);
        };
        if (payload === undefined) {
            socket.timeout(TIMEOUT_MS).emit(event, handle);
        } else {
            socket.timeout(TIMEOUT_MS).emit(event, payload, handle);
        }
    });
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function onceEvent(socket: Socket, event: string, timeoutMs = TIMEOUT_MS): Promise<any> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timeout waiting for ${event}`)), timeoutMs);
        socket.once(event, (payload: any) => {
            clearTimeout(timer);
            resolve(payload);
        });
    });
}

function expectNoEvent(socket: Socket, event: string, waitMs = 600): Promise<boolean> {
    return new Promise((resolve) => {
        const handler = () => resolve(false);
        socket.once(event, handler);
        setTimeout(() => {
            socket.off(event, handler);
            resolve(true);
        }, waitMs);
    });
}

async function connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
        const s = io(URL, { transports: ["websocket"], reconnection: false, timeout: TIMEOUT_MS });
        s.once("connect", () => resolve(s));
        s.once("connect_error", (e) => reject(e));
    });
}

async function waitForHumanTurn(socket: Socket, gameId: string): Promise<void> {
    for (let i = 0; i < 400; i++) {
        const stateAck: any = await emit(socket, "GAME:GET_STATE", { gameId });
        if (stateAck.ok && (stateAck.data.completed || stateAck.data.currentPlayerId === "P1")) {
            return;
        }
        await sleep(25);
    }
    fail(`waitForHumanTurn timeout game=${gameId}`);
}

async function playOneCard(socket: Socket, gameId: string): Promise<string> {
    const legalAck: any = await emit(socket, "GAME:GET_LEGAL_MOVES", { gameId, playerId: "P1" });
    check("GET_LEGAL_MOVES ok", legalAck.ok, legalAck);
    const cardId = legalAck.data[0].id;
    const playAck: any = await emit(socket, "GAME:PLAY_CARD", { gameId, playerId: "P1", cardId });
    check("PLAY_CARD ok", playAck.ok, playAck);
    return cardId;
}

async function main(): Promise<void> {
    console.log("=== System-level scenario A: multi-client presence & watch ===");
    const host: Socket = await connect();
    const createAck: any = await emit(host, "GAME:CREATE", { numberOfRounds: 1, difficulty: "easy", mode: "SOLO" });
    check("host CREATE ok", createAck.ok, createAck);
    const gameId: string = createAck.data.gameId;
    const joinAck: any = await emit(host, "GAME:JOIN", { gameId, playerId: "P1" });
    check("host JOIN ok", joinAck.ok, joinAck);

    const watcher: Socket = await connect();
    const joinedEvent = onceEvent(watcher, "GAME_JOINED");
    const watcherJoin: any = await emit(watcher, "GAME:JOIN", { gameId, playerId: "P2" });
    check("watcher JOIN ok", watcherJoin.ok, watcherJoin);
    const joined = await joinedEvent;
    check("watcher got GAME_JOINED broadcast", joined.gameId === gameId && joined.playerId === "P2", joined);

    const late: Socket = await connect();
    const lateState = onceEvent(late, "GAME_STATE");
    const lateJoin: any = await emit(late, "GAME:JOIN", { gameId, playerId: "P1" });
    check("late JOIN ok", lateJoin.ok, lateJoin);
    const lateEnvelope = await lateState;
    check("late joiner got GAME_STATE snapshot", lateEnvelope.type === "GAME_STATE" && lateEnvelope.snapshot?.gameId === gameId, lateEnvelope);

    const hostPlayed = onceEvent(host, "CARD_PLAYED");
    const watcherPlayed = onceEvent(watcher, "CARD_PLAYED");
    const cardId = await playOneCard(host, gameId);
    const h = await hostPlayed;
    const w = await watcherPlayed;
    check("host saw own CARD_PLAYED push", h.payload.cardId === cardId, h);
    check("watcher saw CARD_PLAYED push", w.payload.cardId === cardId, w);
    await waitForHumanTurn(host, gameId);

    console.log("=== System-level scenario B: REST+WS interleaved on live server ===");
    const created = await fetch(`${URL}/api/games/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberOfRounds: 1, difficulty: "easy", mode: "SOLO" }),
    });
    const createdBody = await created.json();
    check("REST create 201", created.status === 201 && createdBody.success === true, createdBody);
    const restGameId: string = createdBody.data.gameId;

    const restWatcher: Socket = await connect();
    await emit(restWatcher, "GAME:JOIN", { gameId: restGameId, playerId: "P1" });
    const restPlayed = onceEvent(restWatcher, "CARD_PLAYED");
    const legalRes = await fetch(`${URL}/api/games/${restGameId}/legal-moves/P1`);
    const legalBody = await legalRes.json();
    const restCardId = legalBody.data[0].id;
    const turnRes = await fetch(`${URL}/api/games/play-turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: restGameId, playerId: "P1", cardId: restCardId }),
    });
    const turnBody = await turnRes.json();
    check("REST play-turn 200 sync {events,snapshot}", turnRes.status === 200 && Array.isArray(turnBody.data.events) && turnBody.data.snapshot?.gameId === restGameId, turnBody);
    const rp = await restPlayed;
    check("WS watcher saw REST play CARD_PLAYED", rp.payload.cardId === restCardId, rp);

    const wsLegal: any = await emit(restWatcher, "GAME:GET_LEGAL_MOVES", { gameId: restGameId, playerId: "P1" });
    const wsPlay: any = await emit(restWatcher, "GAME:PLAY_CARD", { gameId: restGameId, playerId: "P1", cardId: wsLegal.data[0].id });
    check("WS PLAY_CARD in REST-created game ok", wsPlay.ok, wsPlay);
    const busy = await fetch(`${URL}/api/games/play-turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: restGameId, playerId: "P1", cardId: restCardId }),
    });
    check("REST play-turn during WS chain -> 409 busy", busy.status === 409, await busy.json());
    await waitForHumanTurn(restWatcher, restGameId);
    const after = await fetch(`${URL}/api/games/${restGameId}/state`);
    const afterBody = await after.json();
    check("REST state consistent after WS play", afterBody.data.currentPlayerId === "P1", afterBody.data);

    console.log("=== System-level scenario C: error paths & lifecycle on live server ===");
    const err: Socket = await connect();
    const unknownAck: any = await emit(err, "GAME:BOGUS", {});
    check("unknown event -> UNKNOWN_EVENT ack", !unknownAck.ok && unknownAck.error.code === "UNKNOWN_EVENT", unknownAck);
    const badAck: any = await emit(err, "GAME:CREATE", { numberOfRounds: 1 });
    check("malformed CREATE -> BAD_PAYLOAD", !badAck.ok && badAck.error.code === "BAD_PAYLOAD", badAck);
    const notFoundAck: any = await emit(err, "GAME:GET_STATE", { gameId: "missing-game" });
    check("non-existent game -> GAME_NOT_FOUND", !notFoundAck.ok && notFoundAck.error.code === "GAME_NOT_FOUND", notFoundAck);
    await emit(err, "GAME:JOIN", { gameId, playerId: "P1" });
    const illegalAck: any = await emit(err, "GAME:PLAY_CARD", { gameId, playerId: "P1", cardId: "bogus-card" });
    check("illegal card -> ILLEGAL_MOVE", !illegalAck.ok && illegalAck.error.code === "ILLEGAL_MOVE", illegalAck);
    const ping: any = await emit(err, "GAME:PING", {});
    check("socket still alive after errors", ping.ok, ping);

    const leftEvent = onceEvent(host, "GAME_LEFT");
    await emit(watcher, "GAME:LEAVE", { gameId });
    const left = await leftEvent;
    check("LEAVE -> GAME_LEFT broadcast", left.gameId === gameId && typeof left.socketId === "string", left);

    const removedEvent = onceEvent(host, "GAME_REMOVED");
    const removeAck: any = await emit(host, "GAME:REMOVE", { gameId });
    check("REMOVE ok", removeAck.ok, removeAck);
    const removed = await removedEvent;
    const removedGameId = removed.payload?.gameId ?? removed.gameId;
    check("GAME_REMOVED pushed", removedGameId === gameId, removed);
    const goneAck: any = await emit(host, "GAME:GET_STATE", { gameId });
    check("state after remove -> GAME_NOT_FOUND", !goneAck.ok && goneAck.error.code === "GAME_NOT_FOUND", goneAck);

    console.log("=== System-level scenario D: room isolation & concurrency ===");
    const a1: Socket = await connect();
    const b1: Socket = await connect();
    const aCreate: any = await emit(a1, "GAME:CREATE", { numberOfRounds: 1, difficulty: "easy", mode: "SOLO" });
    const bCreate: any = await emit(b1, "GAME:CREATE", { numberOfRounds: 1, difficulty: "easy", mode: "SOLO" });
    const gA = aCreate.data.gameId;
    const gB = bCreate.data.gameId;
    await emit(a1, "GAME:JOIN", { gameId: gA, playerId: "P1" });
    await emit(b1, "GAME:JOIN", { gameId: gB, playerId: "P1" });
    const bNoLeak = expectNoEvent(b1, "CARD_PLAYED", 700);
    await playOneCard(a1, gA);
    const isolated = await bNoLeak;
    check("no cross-game event leakage", isolated === true);

    const health = await fetch(`${URL}/api/games/health`);
    check("server healthy after all scenarios", health.status === 200);

    host.close(); watcher.close(); late.close(); restWatcher.close(); err.close(); a1.close(); b1.close();
}

main()
    .then(() => {
        console.log(`=== SYSTEM SCENARIO DONE: ${checks} checks, ${failures} failures ===`);
        process.exit(failures === 0 ? 0 : 1);
    })
    .catch((err) => {
        console.error("=== SYSTEM SCENARIO ABORTED ===", err instanceof Error ? err.message : err);
        process.exit(1);
    });
