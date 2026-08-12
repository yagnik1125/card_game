import { GameMode } from "../../../game-engine/src/core/enums.js";

export type Difficulty = "easy" | "medium" | "hard";

export interface GameCreatePayload {
    numberOfRounds: number;
    difficulty: Difficulty;
    mode: GameMode;
}

export interface GameJoinPayload {
    gameId: string;
    playerId: string;
}

export interface GameLeavePayload {
    gameId: string;
}

export interface GameRemovePayload {
    gameId: string;
}

export interface GamePlayCardPayload {
    gameId: string;
    playerId: string;
    cardId: string;
}

export interface GameGetStatePayload {
    gameId: string;
}

export interface GameGetTurnPayload {
    gameId: string;
}

export interface GameGetLegalMovesPayload {
    gameId: string;
    playerId: string;
}

export interface GameGetHandPayload {
    gameId: string;
    playerId: string;
}

export interface GamePingPayload {
    // marker type so GAME:PING has an explicit (empty) payload contract
    _?: undefined;
}

export type ClientCommand =
    | { event: "GAME:PING"; payload?: GamePingPayload }
    | { event: "GAME:CREATE"; payload: GameCreatePayload }
    | { event: "GAME:JOIN"; payload: GameJoinPayload }
    | { event: "GAME:LEAVE"; payload: GameLeavePayload }
    | { event: "GAME:REMOVE"; payload: GameRemovePayload }
    | { event: "GAME:PLAY_CARD"; payload: GamePlayCardPayload }
    | { event: "GAME:GET_STATE"; payload: GameGetStatePayload }
    | { event: "GAME:GET_TURN"; payload: GameGetTurnPayload }
    | { event: "GAME:GET_LEGAL_MOVES"; payload: GameGetLegalMovesPayload }
    | { event: "GAME:GET_HAND"; payload: GameGetHandPayload };

export const CLIENT_COMMAND_NAMES = [
    "GAME:PING",
    "GAME:CREATE",
    "GAME:JOIN",
    "GAME:LEAVE",
    "GAME:REMOVE",
    "GAME:PLAY_CARD",
    "GAME:GET_STATE",
    "GAME:GET_TURN",
    "GAME:GET_LEGAL_MOVES",
    "GAME:GET_HAND",
] as const;

export type ClientCommandName = (typeof CLIENT_COMMAND_NAMES)[number];
