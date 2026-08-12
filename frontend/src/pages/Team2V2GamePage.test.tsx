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

import Team2V2GamePage from "@/pages/Team2V2GamePage";
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
        teamId: "T1",
        hand: [
            { id: "c1", suit: "HEARTS", rank: 14 },
            { id: "c2", suit: "SPADES", rank: 13 },
        ],
    },
    { id: "P2", name: "Bot 2", cardsRemaining: 2, tricksWonRound: 0, totalTricks: 3, teamId: "T2" },
    { id: "P3", name: "Bot 3", cardsRemaining: 2, tricksWonRound: 0, totalTricks: 2, teamId: "T1" },
    { id: "P4", name: "Bot 4", cardsRemaining: 2, tricksWonRound: 0, totalTricks: 1, teamId: "T2" },
];

const baseTeams = [
    { id: "T1", name: "Red", tricksWonRound: 0, totalTricks: 7, roundsWon: 1 },
    { id: "T2", name: "Blue", tricksWonRound: 0, totalTricks: 4, roundsWon: 0 },
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
    teams: baseTeams,
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
    teams: baseTeams.map((t) =>
        t.id === "T2"
            ? { ...t, tricksWonRound: 1, totalTricks: 5 }
            : t
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
            trickWinnerTeam: { id: "T2", name: "Blue", tricksWonThisRound: 1, totalTricks: 4, roundsWon: 0 },
        },
        {
            type: "ROUND_COMPLETED",
            playerId: "P2",
            roundNumber: 1,
            roundWinner: { id: "T2", name: "Blue", players: [] },
            roundWinnerTeam: { id: "T1", name: "Red", teams: [] },
        },
        {
            type: "MATCH_COMPLETED",
            winnerTeam: "T1",
            roundWinner: { id: "T1", name: "Red", players: [] },
            roundWinnerTeam: { id: "T1", name: "Red", teams: [] },
        },
    ],
    snapshot: completedView,
};

function renderTeamGamePage() {
    const store = configureStore({ reducer: { game: gameReducer } });
    render(
        <Provider store={store}>
            <MemoryRouter initialEntries={["/game/team2v2/g1"]}>
                <Routes>
                    <Route path="/game/team2v2/:gameId" element={<Team2V2GamePage />} />
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

describe("Team2V2GamePage", () => {
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

    it("shows the team board after loading a game", async () => {
        renderTeamGamePage();
        await flushLoad();
        expect(screen.getAllByText("Red").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Blue").length).toBeGreaterThan(0);
    });

    it("shows an error screen with retry when loading fails", async () => {
        mockedGetView.mockRejectedValue(new Error("ECONNREFUSED"));
        renderTeamGamePage();
        await act(async () => {});
        expect(screen.getByText("Failed to load game")).toBeInTheDocument();

        mockedGetView.mockResolvedValue(baseView as any);
        fireEvent.click(screen.getByText("Retry"));
        await flushLoad();
        expect(screen.getAllByText("Blue").length).toBeGreaterThan(0);
    });

    it("plays a full team match and crowns the winning team", async () => {
        mockedPlayTurn.mockResolvedValue(completedResult as any);
        renderTeamGamePage();
        await flushLoad();

        const aceCard = screen.getByRole("button", { name: /A/ });
        fireEvent.click(aceCard);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(30000);
        });

        expect(mockedPlayTurn).toHaveBeenCalledWith("g1", "P1", "c1");
        expect(
            screen.getByRole("heading", { name: "TEAM Red" })
        ).toBeInTheDocument();
    });

    it("shows the server error message when a play fails", async () => {
        mockedPlayTurn.mockRejectedValue({
            response: { data: { message: "Game is busy" } },
        });
        renderTeamGamePage();
        await flushLoad();

        const aceCard = screen.getByRole("button", { name: /A/ });
        fireEvent.click(aceCard);
        await act(async () => {});

        expect(screen.getByText("Game is busy")).toBeInTheDocument();
    });

    it("does not fetch legal moves when the match is already completed", async () => {
        mockedPlayTurn.mockResolvedValue(completedResult as any);
        renderTeamGamePage();
        await flushLoad();

        const aceCard = screen.getByRole("button", { name: /A/ });
        fireEvent.click(aceCard);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(30000);
        });

        expect(mockedGetLegalMoves).not.toHaveBeenCalled();
    });

    it("updates team and player scoreboard stats when a trick completes", async () => {
        mockedPlayTurn.mockResolvedValue(completedResult as any);
        const { store } = renderTeamGamePage();
        await flushLoad();

        const aceCard = screen.getByRole("button", { name: /A/ });
        fireEvent.click(aceCard);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3600);
        });

        const state = store.getState().game.snapshot;
        expect(state.completed).toBe(false);
        const p2 = state.players.find((p: any) => p.id === "P2");
        expect(p2.tricksWonRound).toBe(1);
        expect(p2.totalTricks).toBe(4);
        const blue = state.teams.find((t: any) => t.id === "T2");
        expect(blue.tricksWonRound).toBe(1);
        expect(blue.totalTricks).toBe(5);
    });
});
