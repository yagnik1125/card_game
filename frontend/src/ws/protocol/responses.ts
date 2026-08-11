/**
 * Ack responses for client commands.
 *
 * Mirrors `backend/src/websocket/protocol/responses.ts` exactly.
 */

export interface WsError {
    code: string;
    message: string;
    gameId?: string;
}

export interface WsAck<T = null> {
    ok: boolean;
    data?: T;
    error?: WsError;
}

export function okAck<T>(data: T): WsAck<T> {
    return { ok: true, data };
}

export function errorAck(
    code: string,
    message: string,
    gameId?: string
): WsAck<null> {
    return { ok: false, error: { code, message, gameId } };
}
