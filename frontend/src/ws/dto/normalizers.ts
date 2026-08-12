/**
 * Pure mappers from envelope payloads to view-friendly shapes.
 *
 * This is the single translation layer between the WS protocol and the UI:
 * components never read envelope payload keys directly.
 */

import type {
    BotPlayedPayload,
    CardPlayedPayload,
    MatchCompletedPayload,
    RoundCompletedPayload,
    TrickCompletedPayload,
} from "../protocol/serverEvents";
import type { GameView, ViewPlay } from "./gameView";

export interface TrickCard {
    playerId: string;
    suit: string;
    rank: number;
}

export function cardPlayToTrickCard(
    payload: CardPlayedPayload | BotPlayedPayload
): TrickCard {
    return {
        playerId: payload.playerId,
        suit: payload.suit,
        rank: payload.rank,
    };
}

export function viewPlayToTrickCard(play: ViewPlay): TrickCard {
    return {
        playerId: play.playerId,
        suit: play.card.suit,
        rank: play.card.rank,
    };
}

export function viewToTrickCards(view: GameView): TrickCard[] {
    return view.currentTrick.plays.map(viewPlayToTrickCard);
}

export interface TrickCompletedModal {
    winnerPlayerId: string | null;
    winnerName: string;
    tricksWonThisRound: number;
    teamName: string | null;
}

export function trickCompletedToModal(
    payload: TrickCompletedPayload
): TrickCompletedModal {
    return {
        winnerPlayerId: payload.winnerPlayerId,
        winnerName: payload.trickWinner.name,
        tricksWonThisRound: payload.trickWinner.tricksWonThisRound,
        teamName: payload.trickWinnerTeam?.name ?? null,
    };
}

export interface RoundCompletedModal {
    roundNumber: number;
    winnerPlayerId: string | null;
    winnerName: string | null;
    teamName: string | null;
}

export function roundCompletedToModal(
    payload: RoundCompletedPayload
): RoundCompletedModal {
    return {
        roundNumber: payload.roundNumber,
        winnerPlayerId: payload.winnerPlayerId,
        winnerName: payload.roundWinner?.name ?? null,
        teamName: payload.roundWinnerTeam?.name ?? null,
    };
}

export interface MatchCompletedModal {
    winnerPlayerId: string | null;
    winnerTeamId: string | null;
    winnerName: string | null;
    teamName: string | null;
}

export function matchCompletedToModal(
    payload: MatchCompletedPayload
): MatchCompletedModal {
    return {
        winnerPlayerId: payload.winnerPlayerId ?? null,
        winnerTeamId: payload.winnerTeamId ?? null,
        winnerName: payload.roundWinner?.name ?? null,
        teamName: payload.roundWinnerTeam?.name ?? null,
    };
}
