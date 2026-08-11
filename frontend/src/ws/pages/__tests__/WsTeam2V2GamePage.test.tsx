import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { io } from "socket.io-client";

import WsTeam2V2GamePage from "@/ws/pages/WsTeam2V2GamePage";
import { makeFakeSocket } from "@/ws/client/__tests__/fakeSocket";
import { resetSocketClient } from "@/ws/client/socketClient";
import { resetConnection } from "@/ws/client/connection";
import { store } from "@/store/store";
import { resetWsGame } from "@/store/slices/wsGameSlice";
import type { ServerEnvelope } from "@/ws/protocol/serverEvents";
import type { GameView, ViewCard } from "@/ws/dto/gameView";

vi.mock("socket.io-client", () => ({ io: vi.fn() }));

function card(
    id: string,
    suit: ViewCard["suit"],
    rank: ViewCard["rank"]
): ViewCard {
    return { id, suit, rank };
}

function makeTeamSnapshot(overrides: Partial<GameView> = {}): GameView {
    return {
        gameId: "g1",
        completed: false,
        roundNumber: 1,
        trumpSuit: "HEARTS",
        champion: null,
        championTeam: "TEAM_A",
        currentPlayerId: "P1",
        players: [
            {
                id: "P1",
                name: "You",
                cardsRemaining: 2,
                tricksWonRound: 0,
                totalTricks: 0,
                roundsWon: 0,
                teamId: "TEAM_A",
                hand: [card("c1", "SPADES", 7), card("c2", "HEARTS", 10)],
            },
            { id: "P2", name: "Bot 1", cardsRemaining: 2, tricksWonRound: 0, totalTricks: 0, roundsWon: 0, teamId: "TEAM_B" },
            { id: "P3", name: "Bot 2", cardsRemaining: 2, tricksWonRound: 0, totalTricks: 0, roundsWon: 0, teamId: "TEAM_A" },
            { id: "P4", name: "Bot 3", cardsRemaining: 2, tricksWonRound: 0, totalTricks: 0, roundsWon: 0, teamId: "TEAM_B" },
        ],
        teams: [
            { id: "TEAM_A", name: "A", tricksWonRound: 0, totalTricks: 0, roundsWon: 0 },
            { id: "TEAM_B", name: "B", tricksWonRound: 0, totalTricks: 0, roundsWon: 0 },
        ],
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

function envelope(type: string, payload: unknown, snapshot?: unknown): ServerEnvelope {
    return {
        type,
        payload,
        snapshot,
        timestamp: Date.now(),
    } as unknown as ServerEnvelope;
}

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
}

function renderTeamGame() {
    return render(
        <Provider store={store}>
            <MemoryRouter initialEntries={["/ws/game/team2v2/g1"]}>
                <Routes>
                    <Route path="/ws/game/team2v2/:gameId" element={<WsTeam2V2GamePage />} />
                    <Route path="/ws" element={<div>ws home</div>} />
                </Routes>
                <LocationProbe />
            </MemoryRouter>
        </Provider>
    );
}

function emitCalls(socket: ReturnType<typeof makeFakeSocket>["socket"], event: string) {
    return socket.emit.mock.calls.filter((args: unknown[]) => args[0] === event);
}

function ackEmit(
    socket: ReturnType<typeof makeFakeSocket>["socket"],
    event: string,
    ack: unknown,
    index = 0
) {
    const call = emitCalls(socket, event)[index] as unknown[];
    const handle = call[call.length - 1] as (err: Error | null, ack: unknown) => void;
    handle(null, ack);
}

type FakeSocket = ReturnType<typeof makeFakeSocket>["socket"];
type FireFn = ReturnType<typeof makeFakeSocket>["fire"];

async function connectAndRenderBoard(socket: FakeSocket, fire: FireFn) {
    act(() => {
        fire("connect");
    });
    expect(emitCalls(socket, "GAME:JOIN")).toHaveLength(1);
    const joinCall = emitCalls(socket, "GAME:JOIN")[0] as unknown[];
    expect(joinCall[1]).toEqual({ gameId: "g1", playerId: "P1" });
    await act(async () => {
        ackEmit(socket, "GAME:JOIN", { ok: true, data: { gameId: "g1" } });
    });
    act(() => {
        fire("GAME_STATE", envelope("GAME_STATE", {}, makeTeamSnapshot()));
    });
    await waitFor(() => {
        expect(screen.getAllByText("Bot 1").length).toBeGreaterThan(0);
    });
}

describe("WsTeam2V2GamePage", () => {
    let socket: FakeSocket;
    let fire: FireFn;

    beforeEach(() => {
        resetSocketClient();
        resetConnection();
        store.dispatch(resetWsGame());
        const fake = makeFakeSocket();
        socket = fake.socket;
        fire = fake.fire;
        vi.mocked(io).mockReturnValue(socket as never);
    });

    it("joins the room and renders the team board with avatars, teams and champion highlight", async () => {
        renderTeamGame();

        expect(screen.queryAllByText("Bot 1")).toHaveLength(0);

        await connectAndRenderBoard(socket, fire);

        expect(screen.getAllByText("Bot 1").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Bot 2").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Bot 3").length).toBeGreaterThan(0);
        // Team names rendered on the scoreboard + on every avatar.
        expect(screen.getAllByText("A").length).toBeGreaterThan(0);
        expect(screen.getAllByText("B").length).toBeGreaterThan(0);
        expect(screen.getAllByText("7").length).toBeGreaterThan(0);
        expect(screen.getAllByText("10").length).toBeGreaterThan(0);

        // championTeam === "TEAM_A" highlights exactly P1 and P3 (two crown badges).
        const crownBadges = document.querySelectorAll('[class*="rotate-[-8deg]"]');
        expect(crownBadges.length).toBe(2);
    });

    it("highlights the other team when championTeam changes", async () => {
        renderTeamGame();
        await connectAndRenderBoard(socket, fire);

        act(() => {
            fire(
                "ROUND_STARTED",
                envelope("ROUND_STARTED", {
                    gameId: "g1",
                    roundNumber: 2,
                    championPlayerId: "P2",
                    championTeamId: "TEAM_B",
                })
            );
        });

        await waitFor(() => {
            const crownBadges = document.querySelectorAll('[class*="rotate-[-8deg]"]');
            expect(crownBadges.length).toBe(2);
        });
        expect(store.getState().wsGame.snapshot?.championTeam).toBe("TEAM_B");
    });

    it("shows the trick winner team modal on TRICK_COMPLETED", async () => {
        renderTeamGame();
        await connectAndRenderBoard(socket, fire);

        act(() => {
            fire(
                "TRICK_COMPLETED",
                envelope(
                    "TRICK_COMPLETED",
                    {
                        trickNumber: 1,
                        winnerPlayerId: "P1",
                        trickWinner: { id: "P1", name: "You", tricksWonThisRound: 1 },
                        trickWinnerTeam: {
                            id: "TEAM_A",
                            name: "A",
                            tricksWonThisRound: 1,
                            totalTricksWon: 3,
                            roundsWon: 1,
                        },
                    },
                    makeTeamSnapshot()
                )
            );
        });

        await waitFor(() => {
            expect(screen.getAllByText("Trick Winner").length).toBeGreaterThan(0);
        });
    });

    it("shows the round winner team modal on ROUND_COMPLETED", async () => {
        renderTeamGame();
        await connectAndRenderBoard(socket, fire);

        act(() => {
            fire(
                "ROUND_COMPLETED",
                envelope(
                    "ROUND_COMPLETED",
                    {
                        roundNumber: 1,
                        winnerPlayerId: "P3",
                        roundWinnerTeam: {
                            id: "TEAM_A",
                            name: "A",
                            teams: [
                                {
                                    id: "TEAM_A",
                                    name: "A",
                                    tricksWonThisRound: 4,
                                    totalTricksWon: 9,
                                    roundsWon: 1,
                                },
                                {
                                    id: "TEAM_B",
                                    name: "B",
                                    tricksWonThisRound: 2,
                                    totalTricksWon: 7,
                                    roundsWon: 0,
                                },
                            ],
                        },
                    },
                    makeTeamSnapshot()
                )
            );
        });

        await waitFor(() => {
            expect(screen.getAllByText("Round Winner").length).toBeGreaterThan(0);
        });
        expect(screen.getAllByText("Team A").length).toBeGreaterThan(0);
    });

    it("crowns the winning team from winnerTeamId on MATCH_COMPLETED (never computed)", async () => {
        renderTeamGame();
        await connectAndRenderBoard(socket, fire);

        act(() => {
            fire(
                "MATCH_COMPLETED",
                envelope(
                    "MATCH_COMPLETED",
                    {
                        winnerPlayerId: null,
                        winnerTeamId: "TEAM_B",
                        roundWinnerTeam: {
                            id: "TEAM_B",
                            name: "B",
                            teams: [
                                {
                                    id: "TEAM_A",
                                    name: "A",
                                    tricksWonThisRound: 2,
                                    totalTricksWon: 7,
                                    roundsWon: 0,
                                },
                                {
                                    id: "TEAM_B",
                                    name: "B",
                                    tricksWonThisRound: 4,
                                    totalTricksWon: 9,
                                    roundsWon: 2,
                                },
                            ],
                        },
                    },
                    makeTeamSnapshot({
                        completed: true,
                        championTeam: "TEAM_B",
                        teams: [
                            { id: "TEAM_A", name: "A", tricksWonRound: 2, totalTricks: 7, roundsWon: 0 },
                            { id: "TEAM_B", name: "B", tricksWonRound: 4, totalTricks: 9, roundsWon: 2 },
                        ],
                    })
                )
            );
        });

        await waitFor(() => {
            expect(screen.getAllByText("Match Complete").length).toBeGreaterThan(0);
        });
        // WsWinnerTeamModal displays the winning team derived from winnerTeamId.
        expect(screen.getAllByText("Champion Team").length).toBeGreaterThan(0);
        expect(store.getState().wsGame.winnerTeamId).toBe("TEAM_B");
        // TEAM_B members are Bot 1 and Bot 3.
        expect(screen.getAllByText("Bot 1").length).toBeGreaterThan(0);
    });

    it("navigates back to /ws when the server removes the game", async () => {
        renderTeamGame();
        await connectAndRenderBoard(socket, fire);

        act(() => {
            fire("GAME_REMOVED", envelope("GAME_REMOVED", { gameId: "g1" }));
        });

        await waitFor(() => {
            expect(screen.getByTestId("location").textContent).toBe("/ws");
        });
    });

    it("emits GAME:PLAY_CARD on a card click", async () => {
        renderTeamGame();
        await connectAndRenderBoard(socket, fire);

        const cardButtons = screen.getAllByRole("button");
        const target = cardButtons.find((btn) => btn.textContent?.includes("7"));
        expect(target).toBeDefined();
        fireEvent.click(target!);

        expect(emitCalls(socket, "GAME:PLAY_CARD")).toHaveLength(1);
        const playCall = emitCalls(socket, "GAME:PLAY_CARD")[0] as unknown[];
        expect(playCall[1]).toEqual({
            gameId: "g1",
            playerId: "P1",
            cardId: "c1",
        });
    });
});
