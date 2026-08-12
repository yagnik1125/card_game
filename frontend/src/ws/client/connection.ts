/**
 * Connection status store for the WS client.
 *
 * A tiny module-level store (subscribe/notify) so any component can react to
 * socket connect/disconnect/reconnect/error transitions without prop drilling.
 */

export type ConnectionStatus =
    | "idle"
    | "connecting"
    | "connected"
    | "reconnecting"
    | "error";

export type ConnectionListener = (
    status: ConnectionStatus,
    error: Error | null
) => void;

let status: ConnectionStatus = "idle";
let lastError: Error | null = null;
const listeners = new Set<ConnectionListener>();

export function getConnectionStatus(): ConnectionStatus {
    return status;
}

export function getConnectionError(): Error | null {
    return lastError;
}

export function setConnectionStatus(
    next: ConnectionStatus,
    error: Error | null = null
): void {
    status = next;
    lastError = error;
    listeners.forEach((listener) => {
        listener(status, lastError);
    });
}

export function onConnectionChange(listener: ConnectionListener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function resetConnection(): void {
    status = "idle";
    lastError = null;
    listeners.clear();
}
