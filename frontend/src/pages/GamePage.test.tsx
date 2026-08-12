import { act, fireEvent, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("@/api/gameApi", () => ({
    getView: vi.fn(),
    playTurn: vi.fn(),
    getLegalMoves: vi.fn(),
    removeGame: vi.fn(),
}));

import GamePage from "@/pages/GamePage";
import gameReducer from "@/store/slices/gameSlice";
import { getLegalMoves, getView, playTurn } from "@/api/gameApi";

const mockedGetView = vi.mocked(getView);
const mockedPlayTurn = vi.mocked(playTurn);
const mockedGetLegalMoves = vi.mocked(getLegalMoves);

const basePlayers = [
    {
        id: "P1",
        name: "You",
        cardsRemaining: 2,
        tricksWonRound: 0,
        totalTricks: 5,
        hand: [
            { id: "c1", suit: "HEARTS", rank: 14 },
            { id: "c2", suit: "SPADES", rank: 13 },
        ],
    },
    { id: "P2", name: "Bot 2", cardsRemaining: 2, tricksWonRound: 0, totalTricks: 3 },
    { id: "P3", name: "Bot 3", cardsRemaining: 2, tricksWonRound: 0, totalTricks: 2 },
    { id: "P4", name: "Bot 4", cardsRemaining: 2, tricksWonRound: 0, totalTricks: 1 },
];

const baseView = {
    gameId: "g1",
    completed: false,
    roundNumber: 1,
    trumpSuit: null,
    champion: null,
    championTeam: null,
    currentPlayerId: "P1",
    players: basePlayers,
    teams: [],
    legalMoves: ["c1"],
    currentTrick: { trickNumber: 1, leadSuit: null, plays: [], winnerPlayerId: null },
};

const completedView = {
    ...baseView,
    completed: true,
    currentPlayerId: "P2",
    players: basePlayers.map((p) =>
        p.id === "P2"
            ? { ...p, cardsRemaining: 0, tricksWonRound: 1, totalTricks: 4 }
            : { ...p, cardsRemaining: 0 }
    ),
};

const completedResult = {
    events: [
        { type: "CARD_PLAYED", playerId: "P1", cardId: "c1", suit: "HEARTS", rank: 14 },
        { type: "BOT_PLAY", playerId: "P2", cardId: "b1", suit: "SPADES", rank: 11 },
        { type: "BOT_PLAY", playerId: "P3", cardId: "b2", suit: "CLUBS", rank: 10 },
        { type: "BOT_PLAY", playerId: "P4", cardId: "b3", suit: "DIAMONDS", rank: 9 },
        {
            type: "TRICK_COMPLETED",
            playerId: "P2",
            trickNumber: 1,
            trickWinner: { id: "P2", name: "Bot 2", tricksWonThisRound: 1 },
        },
        {
            type: "ROUND_COMPLETED",
            playerId: "P2",
            roundNumber: 1,
            roundWinner: { id: "P2", name: "Bot 2", players: [] },
        },
        {
            type: "MATCH_COMPLETED",
            winner: "P2",
            roundWinner: { id: "P2", name: "Bot 2", players: [] },
        },
    ],
    snapshot: completedView,
};

function renderGamePage() {
    const store = configureStore({ reducer: { game: gameReducer } });
    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={["/game/g1"]}>
                <Routes>
                    <Route path="/game/:gameId" element={<GamePage />} />
                    <Route path="/" element={<div>HOME</div>} />
                </Routes>
            </MemoryRouter>
        </Provider>
    );
    return { store };
}

async function flushLoad() {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
    });
}

describe("GamePage", () => {
    beforeEach(() => {
        vi.useFakeTimers({
            toFake: [
                "setTimeout",
                "clearTimeout",
                "setInterval",
                "clearInterval",
                "setImmediate",
                "clearImmediate",
                "Date",
                "requestAnimationFrame",
                "cancelAnimationFrame",
            ],
        });
        vi.clearAllMocks();
        mockedGetView.mockResolvedValue(baseView as any);
        mockedGetLegalMoves.mockResolvedValue([]);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("shows the board after loading a game", async () => {
        renderGamePage();
        await flushLoad();
        expect(screen.getAllByText("Bot 2").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Bot 3").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Bot 4").length).toBeGreaterThan(0);
    });

    it("shows an error screen with retry when loading fails", async () => {
        mockedGetView.mockRejectedValue(new Error("ECONNREFUSED"));
        renderGamePage();
        await act(async () => {});
        expect(screen.getByText("Failed to load game")).toBeInTheDocument();
        expect(screen.getByText("Retry")).toBeInTheDocument();

        mockedGetView.mockResolvedValue(baseView as any);
        fireEvent.click(screen.getByText("Retry"));
        await flushLoad();
        expect(screen.getAllByText("Bot 2").length).toBeGreaterThan(0);
    });

    it("plays a full turn and crowns the backend-declared match winner", async () => {
        mockedPlayTurn.mockResolvedValue(completedResult as any);
        renderGamePage();
        await flushLoad();

        const aceCard = screen.getByRole("button", { name: /A/ });
        fireEvent.click(aceCard);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(30000);
        });

        expect(mockedPlayTurn).toHaveBeenCalledWith("g1", "P1", "c1");
        expect(screen.getByText("Bot 2 Wins")).toBeInTheDocument();
    });

    it("shows the server error message when a play fails", async () => {
        mockedPlayTurn.mockRejectedValue({
            response: { data: { message: "Illegal move" } },
        });
        renderGamePage();
        await flushLoad();

        const aceCard = screen.getByRole("button", { name: /A/ });
        fireEvent.click(aceCard);
        await act(async () => {});

        expect(screen.getByText("Illegal move")).toBeInTheDocument();
    });

    it("does not fetch legal moves when the match is already completed", async () => {
        mockedPlayTurn.mockResolvedValue(completedResult as any);
        renderGamePage();
        await flushLoad();

        const aceCard = screen.getByRole("button", { name: /A/ });
        fireEvent.click(aceCard);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(30000);
        });

        expect(mockedGetLegalMoves).not.toHaveBeenCalled();
    });

    it("patches the P1 hand per event and applies the snapshot once at the end", async () => {
        mockedPlayTurn.mockResolvedValue(completedResult as any);
        const { store } = renderGamePage();
        await flushLoad();

        const aceCard = screen.getByRole("button", { name: /A/ });
        fireEvent.click(aceCard);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(800);
        });

        const midSnapshot = store.getState().game.snapshot;
        const midP1 = midSnapshot.players.find((p: any) => p.id === "P1");
        expect(midP1.hand.map((c: any) => c.id)).toEqual(["c2"]);
        const trickCards = store.getState().game.trickCards;
        expect(trickCards.length).toBeGreaterThanOrEqual(1);
        expect(trickCards[0].playerId).toBe("P1");

        const playedAce = screen.getByRole("button", { name: /A/ });
        expect(playedAce.parentElement?.className).toContain(
            "animate-card-play-bottom"
        );

        await act(async () => {
            await vi.advanceTimersByTimeAsync(30000);
        });

        const finalSnapshot = store.getState().game.snapshot;
        expect(finalSnapshot.completed).toBe(true);
        expect(finalSnapshot.currentPlayerId).toBe("P2");
        expect(screen.getByText("Bot 2 Wins")).toBeInTheDocument();
    });

    it("applies the new round snapshot during the dealing animation", async () => {
        mockedPlayTurn.mockResolvedValue(completedResult as any);
        const { store } = renderGamePage();
        await flushLoad();

        const aceCard = screen.getByRole("button", { name: /A/ });
        fireEvent.click(aceCard);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(5000);
        });

        expect(store.getState().game.dealing).toBe(true);
        expect(store.getState().game.snapshot.completed).toBe(true);
        expect(store.getState().game.trickCards).toHaveLength(0);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(30000);
        });

        expect(store.getState().game.dealing).toBe(false);
        expect(screen.getByText("Bot 2 Wins")).toBeInTheDocument();
    });

    it("animates the trick cards toward the trick winner before clearing", async () => {
        mockedPlayTurn.mockResolvedValue(completedResult as any);
        const { store } = renderGamePage();
        await flushLoad();

        const aceCard = screen.getByRole("button", { name: /A/ });
        fireEvent.click(aceCard);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3000);
        });

        expect(store.getState().game.trickCollect).toBe("P2");
        expect(store.getState().game.trickCards).toHaveLength(4);
        expect(
            document.querySelectorAll(".animate-card-collect-P2").length
        ).toBe(4);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(30000);
        });

        expect(store.getState().game.trickCollect).toBeNull();
        expect(store.getState().game.trickCards).toHaveLength(0);
        expect(screen.getByText("Bot 2 Wins")).toBeInTheDocument();
    });

    it("updates the scoreboard stats when a trick completes", async () => {
        mockedPlayTurn.mockResolvedValue(completedResult as any);
        const { store } = renderGamePage();
        await flushLoad();

        const aceCard = screen.getByRole("button", { name: /A/ });
        fireEvent.click(aceCard);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3600);
        });

        expect(store.getState().game.snapshot.completed).toBe(false);
        const p2 = store
            .getState()
            .game.snapshot.players.find((p: any) => p.id === "P2");
        expect(p2.tricksWonRound).toBe(1);
        expect(p2.totalTricks).toBe(4);
        expect(screen.getByText("Tricks This Round")).toBeInTheDocument();
    });
});
