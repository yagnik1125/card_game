export type GameMode = "SOLO" | "TEAMS_2V2";
export type Difficulty = "easy" | "medium" | "hard";
export type SuitName = "HEARTS" | "DIAMONDS" | "CLUBS" | "SPADES";

export interface Card {
    id: string;
    suit: string;
    rank: number;
}

export interface ViewPlayer {
    id: string;
    name: string;
    cardsRemaining: number;
    tricksWonRound: number;
    totalTricks: number;
    roundsWon: number;
    hand?: Card[];
    teamId?: string;
}

export interface ViewTeam {
    id: string;
    name: string;
    tricksWonRound: number;
    totalTricks: number;
    roundsWon: number;
}

export interface ViewPlay {
    playerId: string;
    card: Card;
}

export interface ViewTrick {
    trickNumber: number;
    leadSuit: string | null;
    plays: ViewPlay[];
    winnerPlayerId: string | null;
}

export interface GameView {
    gameId: string;
    completed: boolean;
    roundNumber: number;
    trumpSuit: string | null;
    champion: string | null;
    championTeam: string | null;
    currentPlayerId: string;
    players: ViewPlayer[];
    teams?: ViewTeam[];
    legalMoves: string[];
    currentTrick: ViewTrick;
}

export interface PlayTurnEvent {
    type: string;
    playerId?: string;
    cardId?: string;
    suit?: string;
    rank?: number;
    winner?: string;
    winnerTeam?: string;
    trickWinner?: any;
    trickWinnerTeam?: any;
    roundWinner?: any;
    roundWinnerTeam?: any;
    [key: string]: any;
}

export interface PlayTurnResult {
    events: PlayTurnEvent[];
    snapshot: GameView;
}
