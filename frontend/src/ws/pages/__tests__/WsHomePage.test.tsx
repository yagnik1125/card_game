import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { io } from "socket.io-client";

import WsHomePage from "@/ws/pages/WsHomePage";
import { makeFakeSocket } from "@/ws/client/__tests__/fakeSocket";
import { resetSocketClient } from "@/ws/client/socketClient";
import { resetConnection } from "@/ws/client/connection";

vi.mock("socket.io-client", () => ({ io: vi.fn() }));

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="location">{location.pathname}</div>;
}

function renderHome() {
    return render(
        <MemoryRouter initialEntries={["/ws"]}>
            <Routes>
                <Route path="/ws" element={<WsHomePage />} />
                <Route path="/ws/game/:gameId" element={<div>ws game</div>} />
                <Route path="/ws/game/team2v2/:gameId" element={<div>ws team game</div>} />
            </Routes>
            <LocationProbe />
        </MemoryRouter>
    );
}

function ackLastEmit(socket: ReturnType<typeof makeFakeSocket>["socket"], event: string, ack: unknown) {
    const calls = socket.emit.mock.calls.filter((args: unknown[]) => args[0] === event);
    const last = calls[calls.length - 1] as unknown[];
    const handle = last[last.length - 1] as (err: Error | null, ack: unknown) => void;
    handle(null, ack);
}

describe("WsHomePage", () => {
    let socket: ReturnType<typeof makeFakeSocket>["socket"];
    let fire: ReturnType<typeof makeFakeSocket>["fire"];

    beforeEach(() => {
        resetSocketClient();
        resetConnection();
        const fake = makeFakeSocket();
        socket = fake.socket;
        fire = fake.fire;
        vi.mocked(io).mockReturnValue(socket as never);
    });

    it("connects, pings the game server, and enables the play button", async () => {
        renderHome();

        await waitFor(() => {
            expect(
                socket.emit.mock.calls.some((args: unknown[]) => args[0] === "GAME:PING")
            ).toBe(true);
        });

        fire("connect");
        ackLastEmit(socket, "GAME:PING", { ok: true, data: null });

        await waitFor(() => {
            expect(screen.getByRole("button", { name: /play 3 rounds/i })).toBeEnabled();
        });
    });

    it("shows the error screen when the game server is unreachable", async () => {
        renderHome();

        await waitFor(() => {
            expect(
                socket.emit.mock.calls.some((args: unknown[]) => args[0] === "GAME:PING")
            ).toBe(true);
        });

        ackLastEmit(socket, "GAME:PING", {
            ok: false,
            error: { code: "TIMEOUT", message: "timeout" },
        });

        await waitFor(() => {
            expect(screen.getByText(/check that the backend is running/i)).toBeInTheDocument();
        });
    });

    it("creates a solo game via GAME:CREATE and navigates to /ws/game/:gameId", async () => {
        renderHome();

        await waitFor(() => {
            expect(
                socket.emit.mock.calls.some((args: unknown[]) => args[0] === "GAME:PING")
            ).toBe(true);
        });
        fire("connect");
        ackLastEmit(socket, "GAME:PING", { ok: true, data: null });
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /play 3 rounds/i })).toBeEnabled();
        });

        fireEvent.click(screen.getByRole("button", { name: /play 3 rounds/i }));

        const createCall = await waitFor(() => {
            const call = socket.emit.mock.calls.find(
                (args: unknown[]) => args[0] === "GAME:CREATE"
            );
            expect(call).toBeDefined();
            return call;
        });
        expect(createCall![1]).toEqual({
            numberOfRounds: 3,
            difficulty: "medium",
            mode: "SOLO",
        });

        ackLastEmit(socket, "GAME:CREATE", { ok: true, data: { gameId: "g1" } });

        await waitFor(
            () => {
                expect(screen.getByTestId("location").textContent).toBe("/ws/game/g1");
            },
            { timeout: 3000 }
        );
    });

    it("shows the create error and stays on the page when GAME:CREATE fails", async () => {
        renderHome();

        await waitFor(() => {
            expect(
                socket.emit.mock.calls.some((args: unknown[]) => args[0] === "GAME:PING")
            ).toBe(true);
        });
        fire("connect");
        ackLastEmit(socket, "GAME:PING", { ok: true, data: null });
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /play 3 rounds/i })).toBeEnabled();
        });

        fireEvent.click(screen.getByRole("button", { name: /play 3 rounds/i }));
        await waitFor(() => {
            expect(
                socket.emit.mock.calls.some((args: unknown[]) => args[0] === "GAME:CREATE")
            ).toBe(true);
        });
        ackLastEmit(socket, "GAME:CREATE", {
            ok: false,
            error: { code: "GAME_LIMIT", message: "Too many games" },
        });

        await waitFor(() => {
            expect(screen.getByText("Too many games")).toBeInTheDocument();
        });
        expect(screen.getByTestId("location").textContent).toBe("/ws");
    });

    it("does not navigate when GAME:CREATE acks without a gameId", async () => {
        renderHome();

        await waitFor(() => {
            expect(
                socket.emit.mock.calls.some((args: unknown[]) => args[0] === "GAME:PING")
            ).toBe(true);
        });
        fire("connect");
        ackLastEmit(socket, "GAME:PING", { ok: true, data: null });
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /play 3 rounds/i })).toBeEnabled();
        });

        fireEvent.click(screen.getByRole("button", { name: /play 3 rounds/i }));
        await waitFor(() => {
            expect(
                socket.emit.mock.calls.some((args: unknown[]) => args[0] === "GAME:CREATE")
            ).toBe(true);
        });

        ackLastEmit(socket, "GAME:CREATE", { ok: true, data: undefined });

        await waitFor(() => {
            expect(
                screen.getByText(/failed to create game/i)
            ).toBeInTheDocument();
        });
        expect(screen.getByTestId("location").textContent).toBe("/ws");
    });

    it("releases the shared socket reference when it unmounts", async () => {
        const { unmount } = renderHome();

        await waitFor(() => {
            expect(
                socket.emit.mock.calls.some((args: unknown[]) => args[0] === "GAME:PING")
            ).toBe(true);
        });
        expect(socket.disconnect).not.toHaveBeenCalled();

        unmount();

        expect(socket.disconnect).toHaveBeenCalledTimes(1);
    });

    it("creates a teams 2v2 game via GAME:CREATE and navigates to /ws/game/team2v2/:gameId", async () => {
        renderHome();

        await waitFor(() => {
            expect(
                socket.emit.mock.calls.some((args: unknown[]) => args[0] === "GAME:PING")
            ).toBe(true);
        });
        fire("connect");
        ackLastEmit(socket, "GAME:PING", { ok: true, data: null });
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /play 3 rounds/i })).toBeEnabled();
        });

        fireEvent.click(screen.getByRole("button", { name: /teams 2v2/i }));
        fireEvent.click(screen.getByRole("button", { name: /play 3 rounds/i }));

        const createCall = await waitFor(() => {
            const call = socket.emit.mock.calls.find(
                (args: unknown[]) => args[0] === "GAME:CREATE"
            );
            expect(call).toBeDefined();
            return call;
        });
        expect(createCall![1]).toEqual({
            numberOfRounds: 3,
            difficulty: "medium",
            mode: "TEAMS_2V2",
        });

        ackLastEmit(socket, "GAME:CREATE", { ok: true, data: { gameId: "g1" } });

        await waitFor(
            () => {
                expect(screen.getByTestId("location").textContent).toBe("/ws/game/team2v2/g1");
            },
            { timeout: 3000 }
        );
    });
});
