/**
 * Friendly, stable error messages for WS game errors.
 *
 * The backend ack/error payloads carry short codes; the UI maps them to the
 * same human wording the REST frontend uses. Unknown codes fall back to the
 * server-provided message so no information is lost.
 */

export const WS_ERROR_MESSAGES: Readonly<Record<string, string>> = {
    ILLEGAL_MOVE: "Not a legal move",
    NOT_YOUR_TURN: "Not your turn",
    GAME_BUSY: "Bots are playing, one moment",
    GAME_NOT_FOUND: "Game not found",
    UNKNOWN_EVENT: "Unknown event",
    TIMEOUT: "The server did not respond — please try again",
    NO_ACK: "No response from the server",
};

export function friendlyErrorMessage(
    code: string | null | undefined,
    fallback: string
): string {
    if (code && WS_ERROR_MESSAGES[code]) {
        return WS_ERROR_MESSAGES[code];
    }
    return fallback;
}

export interface WsErrorInfo {
    code: string;
    message: string;
}

export function mapGameError(error: WsErrorInfo): WsErrorInfo {
    return {
        code: error.code,
        message: friendlyErrorMessage(error.code, error.message),
    };
}
