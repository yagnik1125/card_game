export interface PlayerHandResponse {
    playerId: string;
    cards: {
        id: string;
        suit: string;
        rank: number;
    }[];
}