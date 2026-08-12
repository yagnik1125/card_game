import {
    Difficulty,
    GameCreatePayload,
    GameGetHandPayload,
    GameGetLegalMovesPayload,
    GameGetStatePayload,
    GameGetTurnPayload,
    GameJoinPayload,
    GameLeavePayload,
    GamePlayCardPayload,
    GameRemovePayload,
} from "./clientEvents.js";

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.length > 0;
}

export function isDifficulty(value: unknown): value is Difficulty {
    return value === "easy" || value === "medium" || value === "hard";
}

export function isGameMode(value: unknown): boolean {
    return value === "SOLO" || value === "TEAMS_2V2";
}

export function isGameCreatePayload(payload: unknown): payload is GameCreatePayload {
    if (!isRecord(payload)) {
        return false;
    }
    return (
        typeof payload.numberOfRounds === "number" &&
        Number.isInteger(payload.numberOfRounds) &&
        payload.numberOfRounds >= 1 &&
        payload.numberOfRounds <= 100 &&
        isDifficulty(payload.difficulty) &&
        isGameMode(payload.mode)
    );
}

export function isGameJoinPayload(payload: unknown): payload is GameJoinPayload {
    return (
        isRecord(payload) &&
        isNonEmptyString(payload.gameId) &&
        isNonEmptyString(payload.playerId)
    );
}

export function isGameIdPayload(
    payload: unknown
): payload is GameGetStatePayload | GameGetTurnPayload | GameLeavePayload | GameRemovePayload {
    return isRecord(payload) && isNonEmptyString(payload.gameId);
}

export function isGamePlayerPayload(
    payload: unknown
): payload is GameGetLegalMovesPayload | GameGetHandPayload {
    return (
        isRecord(payload) &&
        isNonEmptyString(payload.gameId) &&
        isNonEmptyString(payload.playerId)
    );
}

export function isGamePlayCardPayload(payload: unknown): payload is GamePlayCardPayload {
    return (
        isRecord(payload) &&
        isNonEmptyString(payload.gameId) &&
        isNonEmptyString(payload.playerId) &&
        isNonEmptyString(payload.cardId)
    );
}
