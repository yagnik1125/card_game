/**
 * Debug script: simulates frontend state tracking against a live backend.
 * Connects, creates a game, plays cards, and logs every state transition
 * so we can spot inconsistencies (wrong currentPlayerId, stale legalMoves,
 * missing dealing animation, etc.).
 */

import { connect, disconnect, emitWithAck, getSocket, onServerEvent } from "../src/ws/client/socketClient";
import { WS_URL } from "../src/config/env";
import type { ServerEnvelope } from "../src/ws/protocol/serverEvents";

interface FrontendState {
    currentPlayerId: string | null;
    legalMoves: string[];
    trickCards: Array<{ playerId: string; suit: string; rank: number }>;
    dealing: boolean;
    roundNumber: number;
    trickNumber: number;
    completed: boolean;
}

let state: FrontendState = {
    currentPlayerId: null,
    legalMoves: [],
    trickCards: [],
    dealing: false,
    roundNumber: 0,
    trickNumber: 0,
    completed: false,
};

function logStateChange(event: string, payload: any, snapshot: any) {
    console.log(`[debug2] ${event} payload=${JSON.stringify(payload).slice(0, 200)}`);
    if (snapshot) {
        console.log(`[debug2]   snapshot.currentPlayerId=${snapshot.currentPlayerId} snapshot.currentTrick.trickNumber=${snapshot.currentTrick.trickNumber} snapshot.currentTrick.plays.length=${snapshot.currentTrick.plays.length}`);
    }
    const prev = { ...state };
    if (event === "TURN_CHANGED") {
        state.currentPlayerId = payload.currentPlayerId;
        state.legalMoves = payload.legalMoves ?? state.legalMoves;
    }
    if (event === "CARD_PLAYED" || event === "BOT_PLAY") {
        state.trickCards.push({ playerId: payload.playerId, suit: payload.suit, rank: payload.rank });
    }
    if (event === "TRICK_COMPLETED") {
        state.trickCards = [];
        state.trickNumber = payload.trickNumber + 1;
    }
    if (event === "ROUND_STARTED") {
        state.dealing = true;
        state.roundNumber = payload.roundNumber;
        state.trickNumber = 1;
        state.trickCards = [];
    }
    if (event === "ROUND_COMPLETED") {
        state.dealing = true;
        state.roundNumber = payload.roundNumber + 1;
        state.trickCards = [];
        state.trickNumber = 1;
    }
    if (event === "MATCH_COMPLETED") {
        state.completed = true;
        state.trickCards = [];
    }
    if (event === "GAME_STATE" && snapshot) {
        state.currentPlayerId = snapshot.currentPlayerId;
        state.legalMoves = snapshot.legalMoves ?? [];
        state.dealing = state.roundNumber === 0;
        state.roundNumber = snapshot.roundNumber;
        state.trickNumber = snapshot.currentTrick.trickNumber;
        state.trickCards = snapshot.currentTrick.plays.map((p: any) => ({
            playerId: p.playerId,
            suit: p.card.suit,
            rank: p.card.rank,
        }));
        state.completed = snapshot.completed;
    }

    const currentPlayerChanged = prev.currentPlayerId !== state.currentPlayerId && state.currentPlayerId !== null;
    const dealingChanged = prev.dealing !== state.dealing;
    const roundChanged = prev.roundNumber !== state.roundNumber;
    const trickCleared = prev.trickCards.length > 0 && state.trickCards.length === 0;
    const matchEnded = state.completed && !prev.completed;
    const cardPlayed = event === "CARD_PLAYED" || event === "BOT_PLAY";

    if (currentPlayerChanged || dealingChanged || roundChanged || trickCleared || matchEnded || event === "TURN_CHANGED" || cardPlayed) {
        console.log(`[debug] ${event.padEnd(20)} | turn=${state.currentPlayerId?.padEnd(3)} | round=${state.roundNumber} | trick=${state.trickNumber} | dealing=${state.dealing} | trickCards=${state.trickCards.length} | legalMoves=${state.legalMoves.length}`);
    }

    if (snapshot && event !== "GAME_STATE") {
        const snapTrickCards = snapshot.currentTrick?.plays?.map((p: any) => ({ playerId: p.playerId, suit: p.card.suit, rank: p.card.rank })) ?? [];
        const mismatch = snapTrickCards.length !== state.trickCards.length ||
            snapTrickCards.some((sc: any, i: number) => {
                const tc = state.trickCards[i];
                return !tc || sc.playerId !== tc.playerId || sc.suit !== tc.suit || sc.rank !== tc.rank;
            });
        if (mismatch) {
            console.log(`[INCONSISTENCY] ${event}: snapshot trickCards != frontend trickCards`);
            console.log(`  snapshot: ${JSON.stringify(snapTrickCards)}`);
            console.log(`  frontend: ${JSON.stringify(state.trickCards)}`);
        }
        if (snapshot.currentPlayerId !== state.currentPlayerId) {
            console.log(`[INCONSISTENCY] ${event}: snapshot currentPlayerId (${snapshot.currentPlayerId}) != frontend (${state.currentPlayerId})`);
        }
    }
}

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
    console.log("[debug] Connecting to", WS_URL);
    connect();
    await sleep(500);
    console.log("[debug] Connected");

    const socket = getSocket();

    socket.on("GAME_CREATED", (envelope: any) => logStateChange("GAME_CREATED", envelope.payload, envelope.snapshot));
    socket.on("ROUND_STARTED", (envelope: any) => logStateChange("ROUND_STARTED", envelope.payload, envelope.snapshot));
    socket.on("CARD_PLAYED", (envelope: any) => logStateChange("CARD_PLAYED", envelope.payload, envelope.snapshot));
    socket.on("BOT_PLAY", (envelope: any) => logStateChange("BOT_PLAY", envelope.payload, envelope.snapshot));
    socket.on("TURN_CHANGED", (envelope: any) => logStateChange("TURN_CHANGED", envelope.payload, envelope.snapshot));
    socket.on("TRUMP_DECLARED", (envelope: any) => logStateChange("TRUMP_DECLARED", envelope.payload, envelope.snapshot));
    socket.on("TRICK_COMPLETED", (envelope: any) => logStateChange("TRICK_COMPLETED", envelope.payload, envelope.snapshot));
    socket.on("ROUND_COMPLETED", (envelope: any) => logStateChange("ROUND_COMPLETED", envelope.payload, envelope.snapshot));
    socket.on("MATCH_COMPLETED", (envelope: any) => logStateChange("MATCH_COMPLETED", envelope.payload, envelope.snapshot));
    socket.on("GAME_STATE", (envelope: any) => logStateChange("GAME_STATE", envelope.payload, envelope.snapshot));
    socket.on("GAME_ERROR", (payload: any) => console.log(`[debug] GAME_ERROR: ${JSON.stringify(payload)}`));

    const createAck = await emitWithAck<{ gameId: string }>("GAME:CREATE", {
        numberOfRounds: 1,
        difficulty: "easy",
        mode: "SOLO",
    });
    if (!createAck.ok) {
        console.error("[debug] GAME:CREATE failed", createAck);
        process.exit(1);
    }
    const gameId = createAck.data!.gameId;
    console.log(`[debug] Created game ${gameId}`);

    const joinAck = await emitWithAck("GAME:JOIN", { gameId, playerId: "P1" });
    if (!joinAck.ok) {
        console.error("[debug] GAME:JOIN failed", joinAck);
        process.exit(1);
    }

    let plays = 0;
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline && !state.completed) {
        const viewAck = await emitWithAck<any>("GAME:GET_STATE", { gameId });
        if (!viewAck.ok) {
            console.error("[debug] GAME:GET_STATE failed", viewAck);
            break;
        }
        const view = viewAck.data;
        if (view?.completed || view?.currentPlayerId === "P1") {
            const legalAck = await emitWithAck<any[]>("GAME:GET_LEGAL_MOVES", { gameId, playerId: "P1" });
            if (!legalAck.ok) {
                console.error("[debug] GAME:GET_LEGAL_MOVES failed", legalAck);
                break;
            }
            const legal = legalAck.data ?? [];
            if (legal.length === 0) {
                console.log("[debug] No legal moves, waiting...");
                await sleep(500);
                continue;
            }
            const playAck = await emitWithAck("GAME:PLAY_CARD", { gameId, playerId: "P1", cardId: legal[0].id });
            if (!playAck.ok) {
                console.error("[debug] GAME:PLAY_CARD failed", playAck);
                break;
            }
            plays++;
            if (plays % 5 === 0) {
                console.log(`[debug] ${plays} plays so far`);
            }
            await sleep(300);
        } else {
            await sleep(200);
        }
    }

    console.log(`[debug] Match finished after ${plays} plays. completed=${state.completed}`);
    disconnect();
}

main().catch((error: unknown) => {
    console.error("[debug] FAIL:", error);
    process.exit(1);
});
