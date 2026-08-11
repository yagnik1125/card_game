/**
 * Winner DTOs pushed inside TRICK/ROUND/MATCH_COMPLETED payloads.
 *
 * Mirrors `backend/game-engine/src/events/GameEvents.ts` exactly
 * (note `totalTricksWon`, not `totalTricks`).
 */

export interface TrickWinner {
    id: string;
    name: string;
    tricksWonThisRound: number;
}

export interface RoundWinner {
    id: string;
    name: string;
    players: TrickWinner[];
}

export interface TrickWinnerTeam {
    id: string;
    name: string;
    tricksWonThisRound: number;
    totalTricksWon: number;
    roundsWon: number;
}

export interface RoundWinnerTeam {
    id: string;
    name: string;
    teams: TrickWinnerTeam[];
}
