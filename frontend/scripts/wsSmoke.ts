/**
 * WS smoke test: connect to the real backend, ping it, disconnect.
 *
 * Run with: npm run ws:smoke  (requires the backend to be running)
 */

import {
    connect,
    disconnect,
    emitWithAck,
    getSocket,
} from "../src/ws/client/socketClient";
import { WS_URL } from "../src/config/env";

const CONNECT_TIMEOUT_MS = 15000;
const PING_TIMEOUT_MS = 5000;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForConnected(): Promise<void> {
    const started = Date.now();
    while (!getSocket().connected) {
        if (Date.now() - started > CONNECT_TIMEOUT_MS) {
            throw new Error(`connect timeout after ${CONNECT_TIMEOUT_MS}ms`);
        }
        await sleep(50);
    }
}

async function main(): Promise<void> {
    console.log(`[ws-smoke] connecting to ${WS_URL}`);
    connect();
    try {
        await waitForConnected();
        console.log("[ws-smoke] connected");

        const ping = await emitWithAck("GAME:PING", undefined, PING_TIMEOUT_MS);
        if (!ping.ok) {
            console.error(
                "[ws-smoke] FAIL: GAME:PING errored",
                JSON.stringify(ping)
            );
            process.exit(1);
        }
        console.log("[ws-smoke] GAME:PING ok:", JSON.stringify(ping));
    } catch (error) {
        console.error("[ws-smoke] FAIL:", (error as Error).message);
        process.exit(1);
    } finally {
        disconnect();
    }
    console.log("[ws-smoke] done");
    process.exit(0);
}

main();
