import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeSocket, type FakeSocketHandle } from "../../client/__tests__/fakeSocket";

const { ioMock } = vi.hoisted(() => ({ ioMock: vi.fn() }));

vi.mock("socket.io-client", () => ({
    io: (...args: unknown[]) => ioMock(...args),
}));

import { useWsGame } from "../useWsGame";
import { resetSocketClient } from "../../client/socketClient";
import { resetConnection } from "../../client/connection";
import { store } from "@/store/store";
import { resetWsGame } from "@/store/slices/wsGameSlice";
import type { ServerEnvelope } from "../../protocol/serverEvents";
import type { GameView, ViewCard } from "../../dto/gameView";

type AckFn = (err: Error | null, ack?: unknown) => void;

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
        timestamp: 1700000000000,
    } as unknown as ServerEnvelope;
}

function wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
}

/** Connects the fake socket, renders the hook, fires `connect`, and resolves the join ack. */
function mountJoinedGame(
    options: Parameters<typeof useWsGame>[0] = { gameId: "g1" }
): { socket: FakeSocketHandle["socket"]; fire: FakeSocketHandle["fire"] } {
    const { socket, fire } = makeFakeSocket();
    ioMock.mockReturnValue(socket);
    renderHook(() => useWsGame(options), { wrapper });
    act(() => {
        fire("connect");
    });
    const joinCall = socket.emit.mock.calls.find(
        (args) => args[0] === "GAME:JOIN"
    );
    if (!joinCall || typeof joinCall[2] !== "function") {
        throw new Error("GAME:JOIN was never emitted");
    }
    act(() => {
        (joinCall[2] as AckFn)(null, { ok: true, data: { gameId: "g1" } });
    });
    return { socket, fire };
}

describe("useWsGame", () => {
    beforeEach(() => {
        resetSocketClient();
        resetConnection();
        ioMock.mockReset();
        store.dispatch(resetWsGame());
    });

    afterEach(() => {
        store.dispatch(resetWsGame());
    });

    it("emits GAME:JOIN on connect and dispatches the GAME_STATE snapshot", async () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        const { result } = renderHook(() => useWsGame({ gameId: "g1" }), {
            wrapper,
        });

        expect(result.current.joined).toBe(false);

        act(() => {
            fire("connect");
        });

        const joinCalls = socket.emit.mock.calls.filter(
            (args) => args[0] === "GAME:JOIN"
        );
        expect(joinCalls).toHaveLength(1);
        expect(joinCalls[0][1]).toEqual({ gameId: "g1", playerId: "P1" });

        await act(async () => {
            (joinCalls[0][2] as AckFn)(null, {
                ok: true,
                data: { gameId: "g1" },
            });
        });

        act(() => {
            fire("GAME_STATE", envelope("GAME_STATE", {}, makeSnapshot()));
        });

        await waitFor(() => {
            expect(store.getState().wsGame.snapshot?.gameId).toBe("g1");
        });
        expect(result.current.joined).toBe(true);
        expect(result.current.connected).toBe(true);
    });

    it("routes each envelope type into the wsGame slice", () => {
        const { socket, fire } = mountJoinedGame();

        act(() => {
            fire("GAME_STATE", envelope("GAME_STATE", {}, makeSnapshot()));
        });

        act(() => {
            fire(
                "CARD_PLAYED",
                envelope("CARD_PLAYED", {
                    playerId: "P1",
                    cardId: "c1",
                    suit: "SPADES",
                    rank: 7,
                })
            );
        });
        expect(store.getState().wsGame.trickCards).toEqual([
            { playerId: "P1", suit: "SPADES", rank: 7 },
        ]);
        expect(
            store
                .getState()
                .wsGame.snapshot?.players.find((p) => p.id === "P1")
                ?.hand?.map((c) => c.id)
        ).toEqual(["c2"]);

        act(() => {
            fire(
                "BOT_PLAY",
                envelope("BOT_PLAY", {
                    playerId: "P2",
                    cardId: "b1",
                    suit: "HEARTS",
                    rank: 10,
                })
            );
        });
        expect(store.getState().wsGame.trickCards).toHaveLength(2);

        act(() => {
            fire(
                "TURN_CHANGED",
                envelope("TURN_CHANGED", {
                    currentPlayerId: "P2",
                    turnNumber: 2,
                })
            );
        });
        expect(store.getState().wsGame.snapshot?.currentPlayerId).toBe("P2");
        expect(store.getState().wsGame.turnNumber).toBe(2);

        act(() => {
            fire(
                "TRUMP_DECLARED",
                envelope("TRUMP_DECLARED", {
                    playerId: "P1",
                    suit: "SPADES",
                })
            );
        });
        expect(store.getState().wsGame.trumpDeclaration).toBe("SPADES");

        act(() => {
            fire(
                "TRICK_COMPLETED",
                envelope(
                    "TRICK_COMPLETED",
                    {
                        trickNumber: 1,
                        winnerPlayerId: "P1",
                        trickWinner: {
                            id: "P1",
                            name: "You",
                            tricksWonThisRound: 1,
                        },
                    },
                    makeSnapshot()
                )
            );
        });
        expect(store.getState().wsGame.trickWinner?.id).toBe("P1");
        expect(store.getState().wsGame.trickCards).toHaveLength(0);

        act(() => {
            fire(
                "ROUND_COMPLETED",
                envelope(
                    "ROUND_COMPLETED",
                    {
                        roundNumber: 1,
                        winnerPlayerId: "P1",
                        roundWinner: {
                            id: "P1",
                            name: "You",
                            players: [],
                        },
                    },
                    makeSnapshot()
                )
            );
        });
        expect(store.getState().wsGame.roundWinner?.id).toBe("P1");
        expect(store.getState().wsGame.dealing).toBe(true);

        act(() => {
            fire(
                "MATCH_COMPLETED",
                envelope(
                    "MATCH_COMPLETED",
                    { winnerPlayerId: "P1", roundWinner: { id: "P1", name: "You", players: [] } },
                    makeSnapshot({ completed: true })
                )
            );
        });
        expect(store.getState().wsGame.winnerPlayerId).toBe("P1");
        expect(socket.emit).toBeDefined();
    });

    it("dedups identical envelopes so they are applied once", () => {
        const { fire } = mountJoinedGame();

        const cardPlayed = envelope("CARD_PLAYED", {
            playerId: "P1",
            cardId: "c1",
            suit: "SPADES",
            rank: 7,
        });
        act(() => {
            fire("CARD_PLAYED", cardPlayed);
            fire("CARD_PLAYED", cardPlayed);
        });
        expect(store.getState().wsGame.trickCards).toHaveLength(1);
    });

    it("surfaces raw GAME_ERROR payloads into the store and onError", () => {
        const onError = vi.fn();
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        const { result } = renderHook(
            () => useWsGame({ gameId: "g1", onError }),
            { wrapper }
        );
        act(() => {
            fire("connect");
        });

        act(() => {
            fire("GAME_ERROR", {
                code: "ILLEGAL_MOVE",
                message: "Not a legal move",
                gameId: "g1",
            });
        });

        expect(store.getState().wsGame.error).toEqual({
            code: "ILLEGAL_MOVE",
            message: "Not a legal move",
        });
        expect(onError).toHaveBeenCalledWith({
            code: "ILLEGAL_MOVE",
            message: "Not a legal move",
            gameId: "g1",
        });
        expect(result.current.error?.code).toBe("ILLEGAL_MOVE");
        expect(socket.off).toBeDefined();
    });

    it("notifies navigation and cleans state on GAME_NOT_FOUND", () => {
        const onGameRemoved = vi.fn();
        const { fire } = mountJoinedGame({ gameId: "g1", onGameRemoved });
        act(() => {
            fire("GAME_STATE", envelope("GAME_STATE", {}, makeSnapshot()));
        });
        expect(store.getState().wsGame.snapshot?.gameId).toBe("g1");

        act(() => {
            fire("GAME_ERROR", {
                code: "GAME_NOT_FOUND",
                message: "Game not found",
                gameId: "g1",
            });
        });

        expect(onGameRemoved).toHaveBeenCalledTimes(1);
        expect(store.getState().wsGame.snapshot).toBeNull();
    });

    it("resets state and notifies navigation on GAME_REMOVED", () => {
        const onGameRemoved = vi.fn();
        const { fire } = mountJoinedGame({ gameId: "g1", onGameRemoved });
        act(() => {
            fire("GAME_STATE", envelope("GAME_STATE", {}, makeSnapshot()));
        });

        act(() => {
            fire("GAME_REMOVED", envelope("GAME_REMOVED", { gameId: "g1" }));
        });

        expect(onGameRemoved).toHaveBeenCalledTimes(1);
        expect(store.getState().wsGame.snapshot).toBeNull();
    });

    it("re-emits GAME:JOIN on reconnect and resyncs via GAME_STATE", async () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        const { result } = renderHook(() => useWsGame({ gameId: "g1" }), {
            wrapper,
        });
        act(() => {
            fire("connect");
        });
        const firstJoin = socket.emit.mock.calls.find(
            (args) => args[0] === "GAME:JOIN"
        );
        await act(async () => {
            (firstJoin![2] as AckFn)(null, {
                ok: true,
                data: { gameId: "g1" },
            });
        });
        act(() => {
            fire("GAME_STATE", envelope("GAME_STATE", {}, makeSnapshot()));
        });
        await waitFor(() => {
            expect(store.getState().wsGame.snapshot?.roundNumber).toBe(1);
        });

        act(() => {
            fire("disconnect", "transport close");
        });
        act(() => {
            fire("connect");
        });

        // The reconnect completion is surfaced so the UI can show "Resynced".
        expect(result.current.reconnecting).toBe(false);
        expect(result.current.resynced).toBe(true);

        const joinCalls = socket.emit.mock.calls.filter(
            (args) => args[0] === "GAME:JOIN"
        );
        expect(joinCalls).toHaveLength(2);
        await act(async () => {
            (joinCalls[1][2] as AckFn)(null, {
                ok: true,
                data: { gameId: "g1" },
            });
        });

        act(() => {
            fire(
                "GAME_STATE",
                envelope("GAME_STATE", {}, makeSnapshot({ roundNumber: 2 }))
            );
        });
        await waitFor(() => {
            expect(store.getState().wsGame.snapshot?.roundNumber).toBe(2);
        });
    });

    it("applies no event twice when a stale play arrives after a resync", async () => {
        const { fire } = mountJoinedGame();
        act(() => {
            fire("GAME_STATE", envelope("GAME_STATE", {}, makeSnapshot()));
        });
        await waitFor(() => {
            expect(store.getState().wsGame.snapshot?.gameId).toBe("g1");
        });

        // A resync lands mid-trick with two cards already on the table.
        const resynced = makeSnapshot({
            roundNumber: 2,
            currentTrick: {
                id: "t2",
                trickNumber: 2,
                leadSuit: "SPADES",
                plays: [
                    { playerId: "P2", card: { id: "b1", suit: "HEARTS", rank: 10 } },
                    { playerId: "P3", card: { id: "b2", suit: "CLUBS", rank: 5 } },
                ],
                winnerPlayerId: null,
            },
        });
        act(() => {
            fire("GAME_STATE", envelope("GAME_STATE", {}, resynced));
        });
        await waitFor(() => {
            expect(store.getState().wsGame.trickCards).toHaveLength(2);
        });

        // A stale BOT_PLAY that the snapshot already reflects must not re-append.
        act(() => {
            fire(
                "BOT_PLAY",
                envelope("BOT_PLAY", {
                    playerId: "P2",
                    cardId: "b1",
                    suit: "HEARTS",
                    rank: 10,
                })
            );
        });
        expect(store.getState().wsGame.trickCards).toHaveLength(2);
    });

    it("a second client joining mid-game renders the pushed GAME_STATE with no extra calls", async () => {
        // First client: the game is already in round 2.
        const { fire: firstFire } = mountJoinedGame();
        act(() => {
            firstFire(
                "GAME_STATE",
                envelope("GAME_STATE", {}, makeSnapshot({ roundNumber: 2 }))
            );
        });
        await waitFor(() => {
            expect(store.getState().wsGame.snapshot?.roundNumber).toBe(2);
        });

        // A genuinely new connection (fresh socket) joins the in-progress game.
        resetSocketClient();
        resetConnection();
        const { socket: lateSocket, fire: lateFire } = mountJoinedGame({
            gameId: "g1",
        });

        // The server pushes the mid-game snapshot; the client applies it as-is.
        act(() => {
            lateFire(
                "GAME_STATE",
                envelope(
                    "GAME_STATE",
                    {},
                    makeSnapshot({ roundNumber: 3, currentPlayerId: "P2" })
                )
            );
        });

        await waitFor(() => {
            expect(store.getState().wsGame.snapshot?.roundNumber).toBe(3);
        });
        expect(store.getState().wsGame.snapshot?.currentPlayerId).toBe("P2");

        // The snapshot is pushed, never polled: exactly one GAME:JOIN and no
        // resync requests were emitted by the late joiner.
        const joinCalls = lateSocket.emit.mock.calls.filter(
            (args) => args[0] === "GAME:JOIN"
        );
        expect(joinCalls).toHaveLength(1);
        expect(joinCalls[0][1]).toEqual({ gameId: "g1", playerId: "P1" });
        expect(
            lateSocket.emit.mock.calls.filter(
                (args) => args[0] !== "GAME:JOIN" && args[0] !== "GAME:LEAVE"
            )
        ).toHaveLength(0);
    });

    it("reconnects with a fresh GAME:JOIN while a join is in flight and ignores the stale ack", async () => {
        const onGameRemoved = vi.fn();
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        renderHook(() => useWsGame({ gameId: "g1", onGameRemoved }), {
            wrapper,
        });

        // The socket connects and the first join is emitted, left unacked.
        act(() => {
            fire("connect");
        });
        const joinsBefore = socket.emit.mock.calls.filter(
            (args) => args[0] === "GAME:JOIN"
        );
        expect(joinsBefore).toHaveLength(1);

        // The transport drops and reconnects while that join is still unacked.
        act(() => {
            fire("disconnect", "transport close");
        });
        act(() => {
            fire("connect");
        });

        const joinCalls = socket.emit.mock.calls.filter(
            (args) => args[0] === "GAME:JOIN"
        );
        expect(joinCalls).toHaveLength(2);

        // The fresh join succeeds and the snapshot converges.
        await act(async () => {
            (joinCalls[1][2] as AckFn)(null, {
                ok: true,
                data: { gameId: "g1" },
            });
        });
        act(() => {
            fire("GAME_STATE", envelope("GAME_STATE", {}, makeSnapshot()));
        });
        await waitFor(() => {
            expect(store.getState().wsGame.snapshot?.gameId).toBe("g1");
        });

        // The stale join's late fatal ack must be ignored.
        await act(async () => {
            (joinCalls[0][2] as AckFn)(null, {
                ok: false,
                error: {
                    code: "GAME_NOT_FOUND",
                    message: "Game not found",
                    gameId: "g1",
                },
            });
        });
        expect(onGameRemoved).not.toHaveBeenCalled();
        expect(store.getState().wsGame.snapshot?.gameId).toBe("g1");
        expect(store.getState().wsGame.error).toBeNull();
    });

    it("unsubscribes and leaves the room on unmount", () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        const { unmount } = renderHook(() => useWsGame({ gameId: "g1" }), {
            wrapper,
        });
        act(() => {
            fire("connect");
        });
        const joinCall = socket.emit.mock.calls.find(
            (args) => args[0] === "GAME:JOIN"
        );
        act(() => {
            (joinCall?.[2] as AckFn)(null, {
                ok: true,
                data: { gameId: "g1" },
            });
        });
        act(() => {
            fire("GAME_STATE", envelope("GAME_STATE", {}, makeSnapshot()));
        });

        unmount();

        const leaveCalls = socket.emit.mock.calls.filter(
            (args) => args[0] === "GAME:LEAVE"
        );
        expect(leaveCalls).toHaveLength(1);
        expect(leaveCalls[0][1]).toEqual({ gameId: "g1" });

        const afterReset = store.getState().wsGame.trickCards;
        act(() => {
            fire(
                "CARD_PLAYED",
                envelope("CARD_PLAYED", {
                    playerId: "P1",
                    cardId: "c9",
                    suit: "SPADES",
                    rank: 9,
                })
            );
        });
        expect(store.getState().wsGame.trickCards).toEqual(afterReset);
    });

    it("handles a failed join ack like GAME_NOT_FOUND", async () => {
        const onGameRemoved = vi.fn();
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        const { result } = renderHook(
            () => useWsGame({ gameId: "g1", onGameRemoved }),
            { wrapper }
        );
        act(() => {
            fire("connect");
        });
        const joinCall = socket.emit.mock.calls.find(
            (args) => args[0] === "GAME:JOIN"
        );
        await act(async () => {
            (joinCall?.[2] as AckFn)(null, {
                ok: false,
                error: {
                    code: "GAME_NOT_FOUND",
                    message: "Game not found",
                    gameId: "g1",
                },
            });
        });

        expect(onGameRemoved).toHaveBeenCalledTimes(1);
        expect(store.getState().wsGame.snapshot).toBeNull();
        // GAME_NOT_FOUND resets the whole slice, so the error is cleared too —
        // the navigation callback is the signal to the page.
        expect(result.current.error).toBeNull();
    });
});
