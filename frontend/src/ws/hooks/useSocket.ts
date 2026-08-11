/**
 * React hook exposing the singleton socket and its connection status.
 *
 * Connects on mount, subscribes to status changes, and disconnects on unmount.
 */

import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import {
    connect,
    disconnect,
    getSocket,
    onConnectionChange,
} from "../client/socketClient";
import {
    getConnectionError,
    getConnectionStatus,
    type ConnectionStatus,
} from "../client/connection";

export interface UseSocketResult {
    status: ConnectionStatus;
    error: Error | null;
    socket: Socket;
    /** True while the socket is actively trying to reconnect. */
    reconnecting: boolean;
}

export function useSocket(url?: string): UseSocketResult {
    const [status, setStatus] = useState<ConnectionStatus>(getConnectionStatus);
    const [error, setError] = useState<Error | null>(getConnectionError);

    useEffect(() => {
        const unsubscribe = onConnectionChange((next, err) => {
            setStatus(next);
            setError(err);
        });
        connect(url);
        return () => {
            unsubscribe();
            disconnect();
        };
    }, [url]);

    return {
        status,
        error,
        socket: getSocket(),
        reconnecting: status === "reconnecting",
    };
}
