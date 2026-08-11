/**
 * Game view DTOs.
 *
 * Mirrors `GameService.getView` (backend/src/services/GameService.ts) and the
 * engine `Trick`/`Card` shapes exactly — this is the shape of the WS `snapshot`
 * payload and of `GET_STATE` ack data.
 */

export type Suit = "SPADES" | "HEARTS" | "DIAMONDS" | "CLUBS";

export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface ViewCard {
    id: string;
    suit: Suit;
    rank: Rank;
}

export interface ViewPlay {
    playerId: string;
    card: ViewCard;
}

export interface ViewTrick {
    id: string;
    trickNumber: number;
    leadSuit: Suit | null;
    plays: ViewPlay[];
    winnerPlayerId: string | null;
}

export interface ViewPlayer {
    id: string;
    name: string;
    cardsRemaining: number;
    tricksWonRound: number;
    totalTricks: number;
    roundsWon: number;
    hand?: ViewCard[];
    teamId?: string;
}

export interface ViewTeam {
    id: string;
    name: string;
    tricksWonRound: number;
    totalTricks: number;
    roundsWon: number;
}

export interface GameView {
    gameId: string;
    completed: boolean;
    roundNumber: number;
    trumpSuit: Suit | null;
    champion: string | null;
    championTeam: string | null;
    currentPlayerId: string;
    players: ViewPlayer[];
    teams: ViewTeam[];
    legalMoves: string[];
    currentTrick: ViewTrick;
}

export function isGameView(value: unknown): value is GameView {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }
    const v = value as Record<string, unknown>;
    return (
        typeof v.gameId === "string" &&
        typeof v.currentPlayerId === "string" &&
        Array.isArray(v.players) &&
        typeof v.currentTrick === "object" &&
        v.currentTrick !== null
    );
}
