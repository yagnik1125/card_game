import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { io } from "socket.io-client";

import WsGamePage from "@/ws/pages/WsGamePage";
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
            { id: "P2", name: "Bot 1", cardsRemaining: 2, tricksWonRound: 0, totalTricks: 0, roundsWon: 0 },
            { id: "P3", name: "Bot 2", cardsRemaining: 2, tricksWonRound: 0, totalTricks: 0, roundsWon: 0 },
            { id: "P4", name: "Bot 3", cardsRemaining: 2, tricksWonRound: 0, totalTricks: 0, roundsWon: 0 },
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

function renderGame() {
    return render(
        <Provider store={store}>
            <MemoryRouter initialEntries={["/ws/game/g1"]}>
                <Routes>
                    <Route path="/ws/game/:gameId" element={<WsGamePage />} />
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
        fire("GAME_STATE", envelope("GAME_STATE", {}, makeSnapshot()));
    });
    await waitFor(() => {
        expect(screen.getAllByText("Bot 1").length).toBeGreaterThan(0);
    });
}

function clickHandCard(rankText: string) {
    const cardButtons = screen.getAllByRole("button");
    const target = cardButtons.find((btn) => btn.textContent?.includes(rankText));
    expect(target).toBeDefined();
    fireEvent.click(target!);
}

describe("WsGamePage", () => {
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

    it("shows the loader, joins the room, and renders the board after GAME_STATE", async () => {
        renderGame();

        expect(screen.queryAllByText("Bot 1")).toHaveLength(0);

        await connectAndRenderBoard(socket, fire);

        expect(screen.getAllByText("7").length).toBeGreaterThan(0);
        expect(screen.getAllByText("10").length).toBeGreaterThan(0);
    });

    it("emits GAME:PLAY_CARD on a card click and streams trick cards into the store", async () => {
        renderGame();
        await connectAndRenderBoard(socket, fire);

        clickHandCard("7");

        expect(emitCalls(socket, "GAME:PLAY_CARD")).toHaveLength(1);
        const playCall = emitCalls(socket, "GAME:PLAY_CARD")[0] as unknown[];
        expect(playCall[1]).toEqual({
            gameId: "g1",
            playerId: "P1",
            cardId: "c1",
        });
        await act(async () => {
            ackEmit(socket, "GAME:PLAY_CARD", { ok: true, data: { gameId: "g1" } });
        });
        act(() => {
            fire("CARD_PLAYED", envelope("CARD_PLAYED", { playerId: "P1", cardId: "c1", suit: "SPADES", rank: 7, turnNumber: 3 }));
            fire("BOT_PLAY", envelope("BOT_PLAY", { playerId: "P2", cardId: "b1", suit: "HEARTS", rank: 10, turnNumber: 3 }));
            fire("TURN_CHANGED", envelope("TURN_CHANGED", { turnNumber: 3, currentPlayerId: "P2" }));
        });

        await waitFor(() => {
            expect(store.getState().wsGame.trickCards).toHaveLength(2);
        });
        expect(store.getState().wsGame.turnNumber).toBe(3);
    });

    it("shows an error banner when a play ack fails", async () => {
        renderGame();
        await connectAndRenderBoard(socket, fire);

        clickHandCard("7");
        await act(async () => {
            ackEmit(socket, "GAME:PLAY_CARD", {
                ok: false,
                error: { code: "ILLEGAL_MOVE", message: "Not a legal move" },
            });
        });

        await waitFor(() => {
            expect(screen.getByText("Not a legal move")).toBeInTheDocument();
        });
    });

    it("shows the match winner modal on MATCH_COMPLETED", async () => {
        renderGame();
        await connectAndRenderBoard(socket, fire);

        act(() => {
            fire(
                "MATCH_COMPLETED",
                envelope(
                    "MATCH_COMPLETED",
                    { winnerPlayerId: "P1", winnerTeamId: null },
                    makeSnapshot({ completed: true, champion: "P1" })
                )
            );
        });

        await waitFor(() => {
            expect(screen.getByText("Match Complete")).toBeInTheDocument();
        });
        expect(screen.getByText("You Won!")).toBeInTheDocument();
    });

    it("navigates back to /ws when the server removes the game", async () => {
        renderGame();
        await connectAndRenderBoard(socket, fire);

        act(() => {
            fire("GAME_REMOVED", envelope("GAME_REMOVED", { gameId: "g1" }));
        });

        await waitFor(() => {
            expect(screen.getByTestId("location").textContent).toBe("/ws");
        });
    });

    it("maps GAME_ERROR codes to friendly copy in the error banner", async () => {
        renderGame();
        await connectAndRenderBoard(socket, fire);

        act(() => {
            fire(
                "GAME_ERROR",
                envelope("GAME_ERROR", {
                    code: "ILLEGAL_MOVE",
                    message: "raw backend text",
                })
            );
        });

        await waitFor(() => {
            expect(screen.getByText("Not a legal move")).toBeInTheDocument();
        });
    });

    it("auto-redirects to /ws on a GAME_NOT_FOUND error", async () => {
        renderGame();
        await connectAndRenderBoard(socket, fire);

        act(() => {
            fire(
                "GAME_ERROR",
                envelope("GAME_ERROR", {
                    code: "GAME_NOT_FOUND",
                    message: "game gone",
                })
            );
        });

        await waitFor(() => {
            expect(screen.getByTestId("location").textContent).toBe("/ws");
        });
    });

    it("shows a reconnecting banner, disables the hand, then flashes resynced", async () => {
        renderGame();
        await connectAndRenderBoard(socket, fire);

        const findCard7 = () =>
            screen
                .getAllByRole("button")
                .find((btn) => btn.textContent?.includes("7"));
        expect(findCard7()!.hasAttribute("disabled")).toBe(false);

        act(() => {
            fire("disconnect", "transport close");
        });
        expect(
            screen.getByText("Reconnecting to the game server…")
        ).toBeInTheDocument();
        expect(findCard7()!.hasAttribute("disabled")).toBe(true);

        act(() => {
            fire("connect");
        });
        await waitFor(() => {
            expect(screen.getByText("Reconnected — resynced")).toBeInTheDocument();
        });
        expect(
            screen.queryByText("Reconnecting to the game server…")
        ).not.toBeInTheDocument();
    });

    it("shows a watching badge when a second client joins", async () => {
        renderGame();
        await connectAndRenderBoard(socket, fire);

        expect(
            screen.queryByText("Another player is watching")
        ).not.toBeInTheDocument();

        act(() => {
            fire(
                "GAME_JOINED",
                envelope("GAME_JOINED", {
                    gameId: "g1",
                    playerId: "P9",
                    socketId: "s2",
                })
            );
        });
        expect(
            screen.getByText("Another player is watching")
        ).toBeInTheDocument();
    });

    it("trick modal is a dialog and closes on Escape", async () => {
        renderGame();
        await connectAndRenderBoard(socket, fire);

        act(() => {
            fire(
                "TRICK_COMPLETED",
                envelope(
                    "TRICK_COMPLETED",
                    {
                        roundNumber: 1,
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

        const dialog = await screen.findByRole("dialog");
        expect(dialog).toHaveAttribute("aria-modal", "true");

        fireEvent.keyDown(window, { key: "Escape" });
        await waitFor(() => {
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });
});
