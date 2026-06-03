export interface Card {
    id: string;
    suit: string;
    rank: number;
}

export interface Player {
    id: string;
    name: string;
    hand: Card[];
}

export interface GameSession {
    gameId: string;
    match: {
        players: Player[];
    };
}