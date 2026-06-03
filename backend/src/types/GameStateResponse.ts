export interface GameStateResponse {
    gameId: string;
    completed: boolean;
    currentPlayerId: string | null;
    turnNumber: number;
    roundNumber: number;
    trumpSuit: string | null;
    players: {
        id: string;
        name: string;
        cardsRemaining: number;
        tricksWon: number;
    }[];
    currentTrick: {
        trickNumber: number;
        leadSuit: string | null;
        plays: {
            playerId: string;
            cardId: string;
        }[];
    };
}