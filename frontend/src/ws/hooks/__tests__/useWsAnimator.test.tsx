import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWsAnimator } from "../useWsAnimator";
import { store } from "@/store/store";
import {
    applyServerEvent,
    resetWsGame,
    setDealing,
    setTrumpDeclaration,
} from "@/store/slices/wsGameSlice";
import type { ServerEnvelope } from "../../protocol/serverEvents";
import type { GameView, ViewCard } from "../../dto/gameView";

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
                cardsRemaining: 3,
                tricksWonRound: 0,
                totalTricks: 0,
                roundsWon: 0,
                hand: [
                    card("c1", "SPADES", 7),
                    card("c2", "HEARTS", 10),
                    card("c3", "CLUBS", 5),
                ],
            },
            {
                id: "P2",
                name: "Bot 1",
                cardsRemaining: 3,
                tricksWonRound: 0,
                totalTricks: 0,
                roundsWon: 0,
            },
            {
                id: "P3",
                name: "Bot 2",
                cardsRemaining: 3,
                tricksWonRound: 0,
                totalTricks: 0,
                roundsWon: 0,
            },
            {
                id: "P4",
                name: "Bot 3",
                cardsRemaining: 3,
                tricksWonRound: 0,
                totalTricks: 0,
                roundsWon: 0,
            },
        ],
        teams: [],
        legalMoves: ["c1", "c2", "c3"],
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

function renderAnimator() {
    return renderHook(
        () =>
            useWsAnimator({
                cardPlayMs: 100,
                dealingMs: 200,
                trumpModalMs: 100,
                trickModalMs: 100,
                roundModalMs: 100,
            }),
        { wrapper }
    );
}

describe("useWsAnimator", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        store.dispatch(resetWsGame());
    });

    afterEach(() => {
        store.dispatch(resetWsGame());
        vi.useRealTimers();
    });

    it("clears the dealing flag after the dealing duration", () => {
        renderAnimator();

        act(() => {
            store.dispatch(setDealing(true));
        });
        expect(store.getState().wsGame.dealing).toBe(true);

        act(() => {
            vi.advanceTimersByTime(199);
        });
        expect(store.getState().wsGame.dealing).toBe(true);

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(store.getState().wsGame.dealing).toBe(false);
    });

    it("holds animating during trick-card placement and clears after cardPlayMs", () => {
        renderAnimator();
        act(() => {
            store.dispatch(
                applyServerEvent(envelope("GAME_STATE", {}, makeSnapshot()))
            );
        });

        act(() => {
            store.dispatch(
                applyServerEvent(
                    envelope("CARD_PLAYED", {
                        playerId: "P1",
                        cardId: "c1",
                        suit: "SPADES",
                        rank: 7,
                    })
                )
            );
        });
        expect(store.getState().wsGame.trickCards).toHaveLength(1);
        expect(store.getState().wsGame.animating).toBe(true);

        act(() => {
            vi.advanceTimersByTime(99);
        });
        expect(store.getState().wsGame.animating).toBe(true);

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(store.getState().wsGame.animating).toBe(false);
    });

    it("re-arms the card timer so a second play extends the animation window", () => {
        renderAnimator();
        act(() => {
            store.dispatch(
                applyServerEvent(envelope("GAME_STATE", {}, makeSnapshot()))
            );
        });

        act(() => {
            store.dispatch(
                applyServerEvent(
                    envelope("CARD_PLAYED", {
                        playerId: "P1",
                        cardId: "c1",
                        suit: "SPADES",
                        rank: 7,
                    })
                )
            );
        });
        act(() => {
            vi.advanceTimersByTime(60);
        });

        act(() => {
            store.dispatch(
                applyServerEvent(
                    envelope("BOT_PLAY", {
                        playerId: "P2",
                        cardId: "b1",
                        suit: "HEARTS",
                        rank: 10,
                    })
                )
            );
        });
        expect(store.getState().wsGame.trickCards).toHaveLength(2);
        expect(store.getState().wsGame.animating).toBe(true);

        // 60ms after the first play: the first timer would have fired, but the
        // second play re-armed it, so animating must still be true.
        act(() => {
            vi.advanceTimersByTime(40);
        });
        expect(store.getState().wsGame.animating).toBe(true);

        act(() => {
            vi.advanceTimersByTime(60);
        });
        expect(store.getState().wsGame.animating).toBe(false);
    });

    it("clears the trump modal after trumpModalMs", () => {
        renderAnimator();

        act(() => {
            store.dispatch(
                applyServerEvent(
                    envelope("TRUMP_DECLARED", {
                        playerId: "P1",
                        suit: "SPADES",
                    })
                )
            );
        });
        expect(store.getState().wsGame.trumpDeclaration).toBe("SPADES");

        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(store.getState().wsGame.trumpDeclaration).toBeNull();
    });

    it("clears the trick winner modal after trickModalMs", () => {
        renderAnimator();
        act(() => {
            store.dispatch(
                applyServerEvent(envelope("GAME_STATE", {}, makeSnapshot()))
            );
        });

        act(() => {
            store.dispatch(
                applyServerEvent(
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
                )
            );
        });
        expect(store.getState().wsGame.trickWinner?.id).toBe("P1");

        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(store.getState().wsGame.trickWinner).toBeNull();
    });

    it("clears the round winner modal after roundModalMs", () => {
        renderAnimator();

        act(() => {
            store.dispatch(
                applyServerEvent(
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
                )
            );
        });
        expect(store.getState().wsGame.roundWinner?.id).toBe("P1");
        expect(store.getState().wsGame.dealing).toBe(true);

        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(store.getState().wsGame.roundWinner).toBeNull();

        // the dealing flag is cleared independently by the dealing timer
        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(store.getState().wsGame.dealing).toBe(false);
    });

    it("leaves the match winner persistent (no timer clears it)", () => {
        renderAnimator();

        act(() => {
            store.dispatch(
                applyServerEvent(
                    envelope(
                        "MATCH_COMPLETED",
                        {
                            winnerPlayerId: "P1",
                            roundWinner: { id: "P1", name: "You", players: [] },
                        },
                        makeSnapshot({ completed: true })
                    )
                )
            );
        });
        expect(store.getState().wsGame.winnerPlayerId).toBe("P1");

        act(() => {
            vi.advanceTimersByTime(10000);
        });
        expect(store.getState().wsGame.winnerPlayerId).toBe("P1");
    });

    it("clears pending timers on unmount so nothing fires afterwards", () => {
        const { unmount } = renderAnimator();

        act(() => {
            store.dispatch(setDealing(true));
            store.dispatch(setTrumpDeclaration("SPADES"));
        });
        expect(store.getState().wsGame.dealing).toBe(true);

        unmount();

        act(() => {
            vi.advanceTimersByTime(10000);
        });
        // Neither the dealing nor the trump timer fired after unmount.
        expect(store.getState().wsGame.dealing).toBe(true);
        expect(store.getState().wsGame.trumpDeclaration).toBe("SPADES");
    });

    it("GAME_STATE resync drops pending timers and does not re-animate rebuilt trick cards", () => {
        renderAnimator();
        act(() => {
            store.dispatch(
                applyServerEvent(envelope("GAME_STATE", {}, makeSnapshot()))
            );
        });
        act(() => {
            store.dispatch(
                applyServerEvent(
                    envelope("CARD_PLAYED", {
                        playerId: "P1",
                        cardId: "c1",
                        suit: "SPADES",
                        rank: 7,
                    })
                )
            );
        });
        expect(store.getState().wsGame.trickCards).toHaveLength(1);
        expect(store.getState().wsGame.animating).toBe(true);

        // A resync mid-trick rebuilds trick cards straight from the snapshot.
        const resynced = makeSnapshot({
            currentTrick: {
                id: "t1",
                trickNumber: 1,
                leadSuit: "SPADES",
                plays: [
                    { playerId: "P1", card: { id: "c1", suit: "SPADES", rank: 7 } },
                    { playerId: "P2", card: { id: "b1", suit: "HEARTS", rank: 10 } },
                ],
                winnerPlayerId: null,
            },
        });
        act(() => {
            store.dispatch(
                applyServerEvent(envelope("GAME_STATE", {}, resynced))
            );
        });
        expect(store.getState().wsGame.trickCards).toHaveLength(2);
        expect(store.getState().wsGame.animating).toBe(false);

        // The previously queued cardPlay timer was dropped: advancing time
        // must not toggle the animation again.
        act(() => {
            vi.advanceTimersByTime(500);
        });
        expect(store.getState().wsGame.animating).toBe(false);
    });
});
