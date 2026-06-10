export interface TrickHistory {
    trickNumber: number;
    winnerPlayerId: string;
    cards: {
        playerId: string;
        cardId: string;
    }[];
}