import { fireEvent, render, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

vi.mock("@/api/gameApi", () => ({
    health: vi.fn(),
    createGame: vi.fn(),
}));

import HomePage from "@/pages/HomePage";
import { createGame, health } from "@/api/gameApi";

const mockedHealth = vi.mocked(health);
const mockedCreateGame = vi.mocked(createGame);

function renderHome() {
    return render(
        <MemoryRouter initialEntries={["/"]}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                    path="/game/:gameId"
                    element={
                        <div>
                            SOLO GAME{" "}
                            <span>placeholder</span>
                        </div>
                    }
                />
                <Route
                    path="/game/team2v2/:gameId"
                    element={<div>TEAM GAME</div>}
                />
            </Routes>
        </MemoryRouter>
    );
}

async function playButton(): Promise<HTMLButtonElement> {
    const button = await screen.findByRole("button", { name: /Play 3 Round/ });
    return button as HTMLButtonElement;
}

describe("HomePage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the game form when the health check succeeds", async () => {
        mockedHealth.mockResolvedValue(true);
        renderHome();
        expect(await screen.findByText("Trump & Twist")).toBeInTheDocument();
        expect(await playButton()).toBeEnabled();
    });

    it("shows an error screen with retry when the health check fails", async () => {
        mockedHealth.mockRejectedValue(new Error("ECONNREFUSED"));
        renderHome();
        expect(await screen.findByText("Cannot reach server")).toBeInTheDocument();
        const retry = screen.getByText("Retry");
        expect(retry).toBeInTheDocument();

        mockedHealth.mockResolvedValue(true);
        fireEvent.click(retry);
        expect(await screen.findByText("Trump & Twist")).toBeInTheDocument();
    });

    it("navigates to the solo game page after creating a game", async () => {
        mockedHealth.mockResolvedValue(true);
        mockedCreateGame.mockResolvedValue({ gameId: "abc123" });
        renderHome();
        const button = await playButton();
        fireEvent.click(button);
        expect(await screen.findByText("SOLO GAME", {}, { timeout: 3000 })).toBeInTheDocument();
        expect(mockedCreateGame).toHaveBeenCalledWith(3, "medium", "SOLO");
    });

    it("navigates to the team game page for TEAMS_2V2 mode", async () => {
        mockedHealth.mockResolvedValue(true);
        mockedCreateGame.mockResolvedValue({ gameId: "abc123" });
        renderHome();
        const button = await playButton();
        fireEvent.click(screen.getByText("Teams 2v2"));
        fireEvent.click(button);
        expect(await screen.findByText("TEAM GAME", {}, { timeout: 3000 })).toBeInTheDocument();
        expect(mockedCreateGame).toHaveBeenCalledWith(3, "medium", "TEAMS_2V2");
    });

    it("shows an error message when creating a game fails", async () => {
        mockedHealth.mockResolvedValue(true);
        mockedCreateGame.mockRejectedValue({
            response: { data: { message: "Invalid rounds" } },
        });
        renderHome();
        const button = await playButton();
        fireEvent.click(button);
        expect(
            await screen.findByText("Invalid rounds", {}, { timeout: 3000 })
        ).toBeInTheDocument();
    });

    it("opens and closes the rule book", async () => {
        mockedHealth.mockResolvedValue(true);
        renderHome();
        await screen.findByText("Trump & Twist");

        fireEvent.click(
            screen.getByRole("button", { name: /How to Play/ })
        );
        expect(
            await screen.findByText("Rule Book", {}, { timeout: 3000 })
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole("button", { name: /Close rules/ })
        );
        await waitForElementToBeRemoved(
            () => screen.queryByText("Rule Book"),
            { timeout: 3000 }
        );
    });
});
