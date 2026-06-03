import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
});

export const createGame = async () => {
    const response = await API.post(
        "/games/create"
    );

    return response.data;
};

export const getGame = async (
    gameId: string
) => {
    const response = await API.get(
        `/games/${gameId}`
    );

    return response.data;
};

export const playCard = async (
    gameId: string,
    playerId: string,
    cardId: string
) => {
    const response = await API.post(
        `/games/${gameId}/play`,
        {
            playerId,
            cardId,
        }
    );

    return response.data;
};