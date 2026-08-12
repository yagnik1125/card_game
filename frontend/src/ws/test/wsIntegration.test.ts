// @vitest-environment node
/**
 * Integration test: proves envelope routing end-to-end against a REAL
 * in-process Socket.IO server (no backend, no React).
 *
 * The FE `socketClient` singleton connects to a stub server that mimics the
 * backend's protocol (acknowledged commands + enveloped pushes). Envelopes are
 * routed through the exact same `createEnvelopeRouter` used by `useWsGame`,
 * and we assert the `wsGame` store converges (join → GAME_STATE → live play →
 * dedup → GAME_REMOVED / raw GAME_ERROR).
 */

import http from "http";
import { Server, type Socket } from "socket.io";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
    connect,
    emitWithAck,
    getSocket,
    onServerEvent,
    resetSocketClient,
} from "@/ws/client/socketClient";
import { resetConnection } from "@/ws/client/connection";
import { SERVER_EVENT_NAMES } from "@/ws/protocol/serverEvents";
import type { ServerEnvelope } from "@/ws/protocol/serverEvents";
import { createEnvelopeRouter } from "@/ws/hooks/useWsGame";
import { store } from "@/store/store";
import { resetWsGame } from "@/store/slices/wsGameSlice";
import type { GameView, ViewCard } from "@/ws/dto/gameView";

function card(
    id: string,
    suit: ViewCard["suit"],
    rank: ViewCard["rank"]
): ViewCard {
    return { id, suit, rank };
}

function makeSnapshot(overrides: Partial<GameView> = {}): GameView {
    return {
        gameId: "g1",
        completed: false,
        roundNumber: 1,
        trumpSuit: "HEARTS",
        champion: null,
        championTeam: null,
        currentPlayerId: "P1",
        players: [
            {
                id: "P1",
                name: "You",
                cardsRemaining: 2,
                tricksWonRound: 0,
                totalTricks: 0,
                roundsWon: 0,
                hand: [card("c1", "SPADES", 7), card("c2", "HEARTS", 10)],
            },
            {
                id: "P2",
                name: "Bot 1",
                cardsRemaining: 2,
                tricksWonRound: 0,
                totalTricks: 0,
                roundsWon: 0,
            },
            {
                id: "P3",
                name: "Bot 2",
                cardsRemaining: 2,
                tricksWonRound: 0,
                totalTricks: 0,
                roundsWon: 0,
            },
            {
                id: "P4",
                name: "Bot 3",
                cardsRemaining: 2,
                tricksWonRound: 0,
                totalTricks: 0,
                roundsWon: 0,
            },
        ],
        teams: [],
        legalMoves: ["c1"],
        currentTrick: {
            id: "t1",
            trickNumber: 1,
            leadSuit: null,
            plays: [],
            winnerPlayerId: null,
        },
        ...overrides,
    };
}

function envelope(
    type: string,
    payload: unknown,
    snapshot?: unknown
): ServerEnvelope {
    return {
        type,
        payload,
        snapshot,
        timestamp: Date.now(),
    } as unknown as ServerEnvelope;
}

interface StubServer {
    httpServer: http.Server;
    io: Server;
    url: string;
    close: () => Promise<void>;
}

async function startStubServer(): Promise<StubServer> {
    const httpServer = http.createServer();
    const io = new Server(httpServer, { cors: { origin: "*" } });

    io.on("connection", (socket: Socket) => {
        socket.on("GAME:JOIN", (payload: unknown, ack?: unknown) => {
            const gameId = (payload as { gameId?: string })?.gameId ?? "g1";
            socket.join(gameId);
            if (typeof ack === "function") {
                ack({ ok: true, data: { gameId } });
            }
            io.to(gameId).emit(
                "GAME_JOINED",
                { gameId, playerId: "P1", socketId: socket.id }
            );
            io.to(gameId).emit("GAME_STATE", envelope("GAME_STATE", {}, makeSnapshot()));
        });

        socket.on("GAME:PLAY_CARD", (payload: unknown, ack?: unknown) => {
            const gameId = (payload as { gameId?: string })?.gameId ?? "g1";
            if (typeof ack === "function") {
                ack({ ok: true, data: { gameId } });
            }
            io.to(gameId).emit(
                "CARD_PLAYED",
                envelope("CARD_PLAYED", {
                    playerId: "P1",
                    cardId: "c1",
                    suit: "SPADES",
                    rank: 7,
                })
            );
            io.to(gameId).emit(
                "BOT_PLAY",
                envelope("BOT_PLAY", {
                    playerId: "P2",
                    cardId: "b1",
                    suit: "HEARTS",
                    rank: 10,
                })
            );
            io.to(gameId).emit(
                "TURN_CHANGED",
                envelope("TURN_CHANGED", {
                    currentPlayerId: "P1",
                    turnNumber: 3,
                })
            );
        });

        socket.on("GAME:TEST_DUP", (payload: unknown, ack?: unknown) => {
            const gameId = (payload as { gameId?: string })?.gameId ?? "g1";
            if (typeof ack === "function") {
                ack({ ok: true, data: { gameId } });
            }
            const dup = envelope("CARD_PLAYED", {
                playerId: "P1",
                cardId: "c1",
                suit: "SPADES",
                rank: 7,
            });
            io.to(gameId).emit("CARD_PLAYED", dup);
            io.to(gameId).emit("CARD_PLAYED", dup);
        });

        socket.on("GAME:TEST_ERROR", (payload: unknown, ack?: unknown) => {
            const gameId = (payload as { gameId?: string })?.gameId ?? "g1";
            if (typeof ack === "function") {
                ack({ ok: true, data: { gameId } });
            }
            // the real backend pushes GAME_ERROR as a RAW payload (no envelope)
            socket.emit("GAME_ERROR", {
                code: "ILLEGAL_MOVE",
                message: "Not a legal move",
                gameId,
            });
        });

        socket.on("GAME:REMOVE", (payload: unknown, ack?: unknown) => {
            const gameId = (payload as { gameId?: string })?.gameId ?? "g1";
            if (typeof ack === "function") {
                ack({ ok: true, data: { gameId } });
            }
            io.to(gameId).emit("GAME_REMOVED", envelope("GAME_REMOVED", { gameId }));
        });

        socket.on("GAME:LEAVE", (payload: unknown, ack?: unknown) => {
            const gameId = (payload as { gameId?: string })?.gameId ?? "g1";
            socket.leave(gameId);
            if (typeof ack === "function") {
                ack({ ok: true, data: null });
            }
        });

        socket.on("GAME:PING", (ack?: unknown) => {
            if (typeof ack === "function") {
                ack({ ok: true, data: null });
            }
        });
    });

    await new Promise<void>((resolve) => {
        httpServer.listen(0, resolve);
    });
    const address = httpServer.address();
    const port = typeof address === "object" && address !== null ? address.port : 0;

    return {
        httpServer,
        io,
        url: `http://localhost:${port}`,
        close: () =>
            new Promise<void>((resolve) => {
                io.close();
                httpServer.close(() => resolve());
            }),
    };
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(
    predicate: () => boolean,
    timeoutMs = 6000
): Promise<void> {
    const started = Date.now();
    while (!predicate()) {
        if (Date.now() - started > timeoutMs) {
            throw new Error("waitFor timed out");
        }
        await sleep(10);
    }
}

let server: StubServer;
let removedCalls = 0;
const errors: Array<{ code: string; message: string }> = [];

const TEST_TIMEOUT = 20000;

describe("wsIntegration (real in-process Socket.IO server)", () => {
    beforeAll(async () => {
        server = await startStubServer();
        connect(server.url);
        await waitFor(() => getSocket().connected, 5000);

        const router = createEnvelopeRouter(store.dispatch, {
            onGameRemoved: () => {
                removedCalls += 1;
            },
            onError: (error) => {
                errors.push({ code: error.code, message: error.message });
            },
        });
        SERVER_EVENT_NAMES.forEach((event) => {
            onServerEvent(event, (_payload, env) => router.handleEnvelope(env));
        });
        getSocket().on("GAME_ERROR", router.handleRawError);
    });

    afterAll(async () => {
        resetSocketClient();
        resetConnection();
        await server.close();
    });

    beforeEach(() => {
        store.dispatch(resetWsGame());
        removedCalls = 0;
        errors.length = 0;
    });

    it(
        "joins a game room and converges the store from the pushed GAME_STATE",
        async () => {
            const ack = await emitWithAck("GAME:JOIN", {
                gameId: "g1",
                playerId: "P1",
            });
            expect(ack.ok).toBe(true);

            await waitFor(
                () => store.getState().wsGame.snapshot?.gameId === "g1"
            );
            expect(store.getState().wsGame.snapshot?.gameId).toBe("g1");
            expect(store.getState().wsGame.snapshot?.players).toHaveLength(4);
            expect(store.getState().wsGame.trickCards).toHaveLength(0);
        },
        TEST_TIMEOUT
    );

    it(
        "streams card plays and turn changes into the store over the socket",
        async () => {
            await emitWithAck("GAME:JOIN", { gameId: "g1", playerId: "P1" });
            await waitFor(
                () => store.getState().wsGame.snapshot?.gameId === "g1"
            );

            const ack = await emitWithAck("GAME:PLAY_CARD", {
                gameId: "g1",
                playerId: "P1",
                cardId: "c1",
            });
            expect(ack.ok).toBe(true);

            await waitFor(
                () => store.getState().wsGame.trickCards.length === 2
            );
            expect(store.getState().wsGame.trickCards[0]).toEqual({
                playerId: "P1",
                suit: "SPADES",
                rank: 7,
            });
            expect(store.getState().wsGame.trickCards[1]).toEqual({
                playerId: "P2",
                suit: "HEARTS",
                rank: 10,
            });
            expect(store.getState().wsGame.turnNumber).toBe(3);
            expect(store.getState().wsGame.snapshot?.currentPlayerId).toBe(
                "P1"
            );
        },
        TEST_TIMEOUT
    );

    it(
        "dedups identical pushed envelopes at the store level",
        async () => {
            await emitWithAck("GAME:JOIN", { gameId: "g1", playerId: "P1" });
            await waitFor(
                () => store.getState().wsGame.snapshot?.gameId === "g1"
            );

            await emitWithAck("GAME:TEST_DUP", { gameId: "g1" });

            await waitFor(
                () => store.getState().wsGame.trickCards.length === 1
            );
            // two identical CARD_PLAYED pushes must apply exactly once
            expect(store.getState().wsGame.trickCards).toHaveLength(1);
        },
        TEST_TIMEOUT
    );

    it(
        "routes raw GAME_ERROR pushes into the store and onError",
        async () => {
            await emitWithAck("GAME:JOIN", { gameId: "g1", playerId: "P1" });

            await emitWithAck("GAME:TEST_ERROR", { gameId: "g1" });

            await waitFor(
                () => store.getState().wsGame.error?.code === "ILLEGAL_MOVE"
            );
            expect(errors).toEqual([
                { code: "ILLEGAL_MOVE", message: "Not a legal move" },
            ]);
        },
        TEST_TIMEOUT
    );

    it(
        "cleans the store and notifies navigation on GAME_REMOVED",
        async () => {
            await emitWithAck("GAME:JOIN", { gameId: "g1", playerId: "P1" });
            await waitFor(
                () => store.getState().wsGame.snapshot?.gameId === "g1"
            );

            await emitWithAck("GAME:REMOVE", { gameId: "g1" });

            await waitFor(() => removedCalls > 0);
            expect(store.getState().wsGame.snapshot).toBeNull();
        },
        TEST_TIMEOUT
    );

    it(
        "acks GAME:PING over the real socket",
        async () => {
            const ack = await emitWithAck("GAME:PING", undefined);
            expect(ack).toEqual({ ok: true, data: null });
        },
        TEST_TIMEOUT
    );
});
