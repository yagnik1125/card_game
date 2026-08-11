import { fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import PlayerHand from "./PlayerHand";
import gameReducer, { setDealing } from "@/store/slices/gameSlice";

const cards = [
    { id: "h9", suit: "HEARTS", rank: 9 },
    { id: "sk", suit: "SPADES", rank: 13 },
    { id: "ca", suit: "CLUBS", rank: 14 },
];

function renderHand(options?: {
    legalMoves?: string[];
    dealing?: boolean;
    disabled?: boolean;
}) {
    const store = configureStore({ reducer: { game: gameReducer } });
    if (options?.dealing) {
        store.dispatch(setDealing(true));
    }
    render(
        <Provider store={store}>
            <PlayerHand
                cards={cards}
                legalMoves={options?.legalMoves ?? []}
                trumpSuit="HEARTS"
                onPlay={vi.fn()}
                disabled={options?.disabled}
            />
        </Provider>
    );
    return { store };
}

describe("PlayerHand", () => {
    it("renders one card button per card", () => {
        renderHand();
        expect(screen.getAllByRole("button")).toHaveLength(cards.length);
    });

    it("sorts cards by suit order then rank descending", () => {
        renderHand();
        const buttons = screen.getAllByRole("button");
        expect(buttons[0]).toHaveTextContent("♠");
        expect(buttons[0]).toHaveTextContent("K");
        expect(buttons[1]).toHaveTextContent("♥");
        expect(buttons[2]).toHaveTextContent("♣");
        expect(buttons[2]).toHaveTextContent("A");
    });

    it("enables only cards present in legalMoves", () => {
        renderHand({ legalMoves: ["sk"] });
        const buttons = screen.getAllByRole("button");
        expect(buttons[0]).toBeEnabled();
        expect(buttons[1]).toBeDisabled();
        expect(buttons[2]).toBeDisabled();
    });

    it("disables all cards when the disabled prop is true", () => {
        renderHand({ legalMoves: ["sk"], disabled: true });
        screen.getAllByRole("button").forEach((button) => {
            expect(button).toBeDisabled();
        });
    });

    it("calls onPlay with the card id for legal cards", () => {
        const store = configureStore({ reducer: { game: gameReducer } });
        const onPlay = vi.fn();
        render(
            <Provider store={store}>
                <PlayerHand
                    cards={cards}
                    legalMoves={["sk"]}
                    trumpSuit="HEARTS"
                    onPlay={onPlay}
                />
            </Provider>
        );
        const buttons = screen.getAllByRole("button");
        fireEvent.click(buttons[0]);
        expect(onPlay).toHaveBeenCalledWith("sk");
        expect(onPlay).toHaveBeenCalledTimes(1);
    });

    it("applies the dealing transform from the center deck", () => {
        const { store } = renderHand({ dealing: true });
        expect(store.getState().game.dealing).toBe(true);
        const first = screen.getAllByRole("button")[0];
        expect(first).toHaveTextContent("♠");
        expect(first.parentElement).toHaveStyle({
            transform: "translate(66px, -38vh) scale(0.3)",
        });
    });
});
