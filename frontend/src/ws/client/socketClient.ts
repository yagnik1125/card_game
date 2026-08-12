/**
 * Typed Socket.IO client singleton.
 *
 * Lazily creates one socket, wires connection-status transitions into the
 * `connection.ts` store, and provides ack-aware emits plus typed server event
 * subscriptions. Uses relative imports so it can also run under plain `tsx`
 * (e.g. `scripts/wsSmoke.ts`).
 */

import { io, type Socket } from "socket.io-client";
import { WS_URL } from "../../config/env";
import type { WsAck } from "../protocol/responses";
import { isServerEnvelope } from "../protocol/guards";
import type { ServerEnvelope, ServerEventName } from "../protocol/serverEvents";
import { setConnectionStatus } from "./connection";

export { onConnectionChange } from "./connection";
export type { ConnectionListener, ConnectionStatus } from "./connection";

type AnyHandler = (...args: never[]) => void;
type EnvelopeListener = (...args: unknown[]) => void;

const wrappedListeners = new WeakMap<AnyHandler, Map<string, EnvelopeListener>>();

let socket: Socket | null = null;
let url: string = WS_URL;
let refCount = 0;

export function getSocket(): Socket {
    if (!socket) {
        socket = io(url, { autoConnect: false });
        wireConnectionEvents(socket);
    }
    return socket;
}

/**
 * Connects the shared socket and registers the caller as a subscriber.
 *
 * The socket is reference-counted: it stays connected until every subscriber
 * has called `disconnect()`. Passing a `urlOverride` that differs from the
 * current URL recreates the socket — a global operation that drops every
 * subscription on the old socket — so it must only be used before other
 * consumers have subscribed (tests / one-off entry points).
 */
export function connect(urlOverride?: string): Socket {
    if (urlOverride && urlOverride !== url) {
        url = urlOverride;
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
            socket = null;
        }
        refCount = 0;
    }
    const target = getSocket();
    refCount += 1;
    // Only announce "connecting" when the socket is not already connected.
    // Re-subscribing to an established socket (e.g. navigating /ws → game)
    // must not reset the status store — the "connect" event will not re-fire
    // and the store would stay stuck on "connecting".
    if (!target.connected) {
        setConnectionStatus("connecting");
    }
    target.connect();
    return target;
}

/**
 * Releases one subscriber. The underlying socket is only disconnected once
 * the last subscriber releases it.
 */
export function disconnect(): void {
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0 && socket) {
        socket.disconnect();
        setConnectionStatus("idle");
    }
}

export function emitWithAck<T = null>(
    event: string,
    payload?: unknown,
    timeoutMs = 5000
): Promise<WsAck<T>> {
    const target = getSocket();
    return new Promise((resolve) => {
        const handle = (err: Error | null, ack: unknown) => {
            if (err) {
                resolve({
                    ok: false,
                    error: { code: "TIMEOUT", message: err.message },
                });
                return;
            }
            if (ack === undefined || ack === null) {
                // A missing ack is a failure, not a silent success — callers
                // that require ack (join, play, ...) would otherwise wait
                // forever for a pushed state that never comes.
                resolve({
                    ok: false,
                    error: {
                        code: "NO_ACK",
                        message: `No acknowledgment received for "${event}"`,
                    },
                });
                return;
            }
            resolve(ack as WsAck<T>);
        };
        if (payload === undefined) {
            target.timeout(timeoutMs).emit(event, handle);
        } else {
            target.timeout(timeoutMs).emit(event, payload, handle);
        }
    });
}

export function onServerEvent<T = unknown>(
    event: ServerEventName,
    handler: (payload: T, envelope: ServerEnvelope) => void
): () => void {
    const target = getSocket();
    const listener = (raw: unknown): void => {
        if (isServerEnvelope(raw)) {
            handler(raw.payload as T, raw);
        }
    };
    let byEvent = wrappedListeners.get(handler);
    if (!byEvent) {
        byEvent = new Map();
        wrappedListeners.set(handler, byEvent);
    }
    byEvent.set(event, listener);
    target.on(event, listener);
    return () => {
        target.off(event, listener);
        byEvent?.delete(event);
        if (byEvent && byEvent.size === 0) {
            wrappedListeners.delete(handler);
        }
    };
}

export function offServerEvent(
    event: ServerEventName,
    handler: AnyHandler
): void {
    const byEvent = wrappedListeners.get(handler);
    const wrapped = byEvent?.get(event);
    if (wrapped && socket && byEvent) {
        socket.off(event, wrapped);
        byEvent.delete(event);
        if (byEvent.size === 0) {
            wrappedListeners.delete(handler);
        }
    }
}

export function resetSocketClient(): void {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
    }
    socket = null;
    refCount = 0;
}

function wireConnectionEvents(target: Socket): void {
    target.on("connect", () => {
        setConnectionStatus("connected");
    });
    target.on("disconnect", (reason: string) => {
        setConnectionStatus(
            reason === "io server disconnect" ? "idle" : "reconnecting"
        );
    });
    target.on("reconnect_attempt", () => {
        setConnectionStatus("reconnecting");
    });
    target.on("reconnect_failed", () => {
        setConnectionStatus("error", new Error("Reconnection failed"));
    });
    target.on("connect_error", (err: Error) => {
        setConnectionStatus(target.active ? "reconnecting" : "error", err);
    });
}
