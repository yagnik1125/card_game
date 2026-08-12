import axios from "axios";
import { API_BASE_URL } from "@/config/env";
import type {
    Card,
    Difficulty,
    GameMode,
    GameView,
    PlayTurnResult,
} from "@/types/game";

const API = axios.create({
    baseURL: API_BASE_URL,
});

export const health = async (): Promise<boolean> => {
    const response = await API.get(`/games/health`);
    return response.data.success;
};

export const createGame = async (
    numberOfRounds: number,
    difficulty: Difficulty,
    mode: GameMode
): Promise<{ gameId: string }> => {
    const response = await API.post("/games/create", {
        numberOfRounds,
        difficulty,
        mode,
    });
    return response.data.data;
};

export const removeGame = async (gameId: string): Promise<void> => {
    await API.delete(`/games/${gameId}`);
};

export const getLegalMoves = async (
    gameId: string,
    playerId: string
): Promise<Card[]> => {
    const response = await API.get(`/games/${gameId}/legal-moves/${playerId}`);
    return response.data.data;
};

export const getView = async (gameId: string): Promise<GameView> => {
    const response = await API.get(`/games/${gameId}/view`);
    return response.data.data;
};

export const playTurn = async (
    gameId: string,
    playerId: string,
    cardId: string
): Promise<PlayTurnResult> => {
    const res = await API.post("/games/play-turn", {
        gameId,
        playerId,
        cardId,
    });
    return res.data.data;
};
