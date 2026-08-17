/**
 * Quick test: 2-round game to verify ROUND_STARTED is emitted.
 */

import { connect, disconnect, emitWithAck, getSocket, onServerEvent } from "../src/ws/client/socketClient";
import { WS_URL } from "../src/config/env";
import type { ServerEnvelope } from "../src/ws/protocol/serverEvents";

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
    connect();
    await sleep(500);

    const socket = getSocket();
    const events: string[] = [];
    socket.onAny((event: string) => {
        events.push(event);
    });

    const createAck = await emitWithAck<{ gameId: string }>("GAME:CREATE", {
        numberOfRounds: 2,
        difficulty: "easy",
        mode: "SOLO",
    });
    const gameId = createAck.data!.gameId;
    console.log("Created game", gameId);

    const joinAck = await emitWithAck("GAME:JOIN", { gameId, playerId: "P1" });
    console.log("Joined", joinAck.ok);

    // Play until match completes
    let plays = 0;
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
        const viewAck = await emitWithAck<any>("GAME:GET_STATE", { gameId });
        if (viewAck.data?.completed) {
            break;
        }
        if (viewAck.data?.currentPlayerId === "P1") {
            const legalAck = await emitWithAck<any[]>("GAME:GET_LEGAL_MOVES", { gameId, playerId: "P1" });
            const legal = legalAck.data ?? [];
            if (legal.length > 0) {
                await emitWithAck("GAME:PLAY_CARD", { gameId, playerId: "P1", cardId: legal[0].id });
                plays++;
                await sleep(200);
            } else {
                await sleep(500);
            }
        } else {
            await sleep(300);
        }
    }

    console.log("Plays:", plays);
    console.log("Events received:", events.join(", "));
    console.log("ROUND_STARTED count:", events.filter(e => e === "ROUND_STARTED").length);
    console.log("ROUND_COMPLETED count:", events.filter(e => e === "ROUND_COMPLETED").length);
    console.log("MATCH_COMPLETED count:", events.filter(e => e === "MATCH_COMPLETED").length);

    disconnect();
    process.exit(0);
}

main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
