import type {
    RoundWinner,
    RoundWinnerTeam,
    TrickWinner,
    TrickWinnerTeam,
} from "../../../game-engine/src/events/GameEvents.js";

export interface GameCreatedPayload {
    gameId: string;
}

export interface GameJoinedPayload {
    gameId: string;
    playerId: string;
    socketId: string;
}

export interface GameLeftPayload {
    gameId: string;
    playerId?: string;
    socketId: string;
}

export interface RoundStartedPayload {
    gameId: string;
    roundNumber: number;
    championPlayerId: string | null;
    championTeamId: string | null;
}

export interface CardPlayedPayload {
    playerId: string;
    cardId: string;
    suit: string;
    rank: number;
}

export interface BotPlayedPayload {
    playerId: string;
    cardId: string;
    suit: string;
    rank: number;
}

export interface TurnChangedPayload {
    currentPlayerId: string;
    turnNumber: number;
    /**
     * P1's legal card ids at the moment of the turn change, so the client can
     * enable exactly the playable cards without an extra round-trip or stale
     * snapshot data. Empty when the game is not in a playable state.
     */
    legalMoves?: string[];
}

export interface TrumpDeclaredPayload {
    playerId: string;
    suit: string | null;
}

export interface TrickCompletedPayload {
    trickNumber: number;
    winnerPlayerId: string | null;
    trickWinner: TrickWinner;
    trickWinnerTeam?: TrickWinnerTeam;
}

export interface RoundCompletedPayload {
    roundNumber: number;
    winnerPlayerId: string | null;
    trickWinner?: TrickWinner;
    trickWinnerTeam?: TrickWinnerTeam;
    roundWinner?: RoundWinner;
    roundWinnerTeam?: RoundWinnerTeam;
}

export interface MatchCompletedPayload {
    winnerPlayerId?: string;
    winnerTeamId?: string;
    roundWinner?: RoundWinner;
    roundWinnerTeam?: RoundWinnerTeam;
}

export interface GameStatePayload {
    gameId: string;
}

export interface GameRemovedPayload {
    gameId: string;
}

export interface GameErrorPayload {
    code: string;
    message: string;
    gameId?: string;
}

export type ServerEvent =
    | { type: "GAME_CREATED"; payload: GameCreatedPayload }
    | { type: "GAME_JOINED"; payload: GameJoinedPayload }
    | { type: "GAME_LEFT"; payload: GameLeftPayload }
    | { type: "ROUND_STARTED"; payload: RoundStartedPayload }
    | { type: "CARD_PLAYED"; payload: CardPlayedPayload }
    | { type: "BOT_PLAY"; payload: BotPlayedPayload }
    | { type: "TURN_CHANGED"; payload: TurnChangedPayload }
    | { type: "TRUMP_DECLARED"; payload: TrumpDeclaredPayload }
    | { type: "TRICK_COMPLETED"; payload: TrickCompletedPayload }
    | { type: "ROUND_COMPLETED"; payload: RoundCompletedPayload }
    | { type: "MATCH_COMPLETED"; payload: MatchCompletedPayload }
    | { type: "GAME_STATE"; payload: GameStatePayload }
    | { type: "GAME_REMOVED"; payload: GameRemovedPayload }
    | { type: "GAME_ERROR"; payload: GameErrorPayload };

export const SERVER_EVENT_NAMES = [
    "GAME_CREATED",
    "GAME_JOINED",
    "GAME_LEFT",
    "ROUND_STARTED",
    "CARD_PLAYED",
    "BOT_PLAY",
    "TURN_CHANGED",
    "TRUMP_DECLARED",
    "TRICK_COMPLETED",
    "ROUND_COMPLETED",
    "MATCH_COMPLETED",
    "GAME_STATE",
    "GAME_REMOVED",
    "GAME_ERROR",
] as const;

export type ServerEventName = (typeof SERVER_EVENT_NAMES)[number];

export interface ServerEnvelope<T = unknown> {
    type: ServerEventName;
    payload: T;
    snapshot?: unknown;
    timestamp: number;
}
