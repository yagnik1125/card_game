import { act, render } from "@testing-library/react";
import { Provider, useSelector } from "react-redux";
import { beforeEach, describe, expect, it } from "vitest";
import { store } from "@/store/store";
import wsGameReducer, {
    applyServerEvent,
    clearError,
    resetWsGame,
    setAnimating,
    setConnection,
    setDealing,
    setLoading,
    setTrumpDeclaration,
} from "@/store/slices/wsGameSlice";
import { wsGameInitialState } from "@/ws/store/eventReducer";
import { selectSnapshot, selectTrickCards } from "@/ws/store/selectors";
import type { ServerEnvelope } from "@/ws/protocol/serverEvents";
import type { GameView } from "@/ws/dto/gameView";

function makeSnapshot(): GameView {
    return {
        gameId: "g1",
        completed: false,
        roundNumber: 1,
        trumpSuit: "HEARTS",
        champion: null,
        championTeam: null,
        currentPlayerId: "P1",
        players: [
            { id: "P1", name: "You", cardsRemaining: 1, tricksWonRound: 0, totalTricks: 0, roundsWon: 0 },
            { id: "P2", name: "Bot 1", cardsRemaining: 1, tricksWonRound: 0, totalTricks: 0, roundsWon: 0 },
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
    };
}

function envelope(type: string, payload: unknown, snapshot?: unknown): ServerEnvelope {
    return {
        type,
        payload,
        snapshot,
        timestamp: 1700000000000,
    } as unknown as ServerEnvelope;
}

describe("wsGameSlice", () => {
    beforeEach(() => {
        store.dispatch(resetWsGame());
    });

    it("is registered in the store with the initial state", () => {
        expect(wsGameReducer).toBeTypeOf("function");
        expect(store.getState().wsGame).toEqual(wsGameInitialState);
    });

    it("applyServerEvent routes the envelope through the event reducer", () => {
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
        expect(store.getState().wsGame.trickCards).toEqual([
            { playerId: "P1", suit: "SPADES", rank: 7 },
        ]);
    });

    it("UI-only setters update their fields", () => {
        store.dispatch(setLoading(true));
        store.dispatch(setDealing(true));
        store.dispatch(setAnimating(true));
        store.dispatch(setTrumpDeclaration("DIAMONDS"));
        store.dispatch(setConnection("connected"));
        const ws = store.getState().wsGame;
        expect(ws.loading).toBe(true);
        expect(ws.dealing).toBe(true);
        expect(ws.animating).toBe(true);
        expect(ws.trumpDeclaration).toBe("DIAMONDS");
        expect(ws.connection).toBe("connected");
    });

    it("clearError resets the error field", () => {
        store.dispatch(
            applyServerEvent(
                envelope("GAME_ERROR", { code: "X", message: "boom" })
            )
        );
        expect(store.getState().wsGame.error).toEqual({
            code: "X",
            message: "boom",
        });
        store.dispatch(clearError());
        expect(store.getState().wsGame.error).toBeNull();
    });

    it("resetWsGame restores the initial state", () => {
        store.dispatch(setLoading(true));
        store.dispatch(setTrumpDeclaration("CLUBS"));
        store.dispatch(resetWsGame());
        expect(store.getState().wsGame).toEqual(wsGameInitialState);
    });

    it("renders under a Provider and reacts to dispatched events", () => {
        function Probe() {
            const snapshot = useSelector(selectSnapshot);
            const trickCards = useSelector(selectTrickCards);
            return (
                <div>
                    <span data-testid="game">{snapshot?.gameId ?? "none"}</span>
                    <span data-testid="tricks">{trickCards.length}</span>
                </div>
            );
        }

        const { getByTestId } = render(
            <Provider store={store}>
                <Probe />
            </Provider>
        );
        expect(getByTestId("game").textContent).toBe("none");

        act(() => {
            store.dispatch(
                applyServerEvent(
                    envelope("GAME_STATE", { gameId: "g1" }, makeSnapshot())
                )
            );
            store.dispatch(
                applyServerEvent(
                    envelope("CARD_PLAYED", {
                        playerId: "P2",
                        cardId: "b1",
                        suit: "CLUBS",
                        rank: 3,
                    })
                )
            );
        });
        expect(getByTestId("game").textContent).toBe("g1");
        expect(getByTestId("tricks").textContent).toBe("1");
    });

    it("store.dispatch typing works for wsGame actions", () => {
        const dispatch = store.dispatch;
        dispatch(setDealing(false));
        expect(store.getState().wsGame.dealing).toBe(false);
    });
});
