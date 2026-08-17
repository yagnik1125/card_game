/**
 * Minimal structured logger for the WebSocket layer. Keeps socket lifecycle,
 * command, and event traffic visible in the same console stream as the REST
 * request logger so a full game session can be traced end to end.
 */

function stamp(): string {
    return new Date().toISOString();
}

export function wsLog(...args: unknown[]): void {
    console.log(`[ws ${stamp()}]`, ...args);
}

export function wsError(...args: unknown[]): void {
    console.error(`[ws ${stamp()}]`, ...args);
}

export function wsGameLog(gameId: string, ...args: unknown[]): void {
    console.log(`[ws ${stamp()}] game=${gameId}`, ...args);
}
