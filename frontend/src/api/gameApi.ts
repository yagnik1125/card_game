import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

export const health = async () => {
    const response = await API.get(`/games/health`);
    return response.data.success;
};

export const createGame = async (numberOfRounds: number, difficulty: "easy" | "medium" | "hard", mode: "SOLO" | "TEAMS_2V2") => {
    const response = await API.post("/games/create",
        {
            numberOfRounds,
            difficulty,
            mode
        }
    );
    return response.data.data;
};

export const getGame = async (gameId: string) => {
    const response = await API.get(`/games/${gameId}`);
    return response.data.data;
};

export const removeGame = async (gameId: string) => {
    const response = await API.delete(`/games/${gameId}`);
    return response.data;
};

export const getPlayerHand = async (gameId: string, playerId: string) => {
    const response = await API.get(`/games/${gameId}/player/${playerId}/hand`);
    return response.data.data;
};

export const getGameState = async (gameId: string) => {
    const response = await API.get(`/games/${gameId}/state`);
    return response.data.data;
};

export const getLegalMoves = async (gameId: string, playerId: string) => {
    const response = await API.get(`/games/${gameId}/legal-moves/${playerId}`);
    return response.data.data;
};

export const getTurn = async (gameId: string) => {
    const response = await API.get(`/games/${gameId}/turn`);
    return response.data.data;
};

export const playCard = async (gameId: string, playerId: string, cardId: string) => {
    const response = await API.post("/games/play-card",
        {
            gameId,
            playerId,
            cardId
        }
    );
    return response.data.data;
};

export const getView = async (gameId: string) => {
    const res = await API.get(`/games/${gameId}/view`);
    return res.data.data;
};

export const playTurn = async (gameId: string, playerId: string, cardId: string) => {
    const res = await API.post("/games/play-turn",
        {
            gameId,
            playerId,
            cardId,
        }
    );
    return res.data.data;
};