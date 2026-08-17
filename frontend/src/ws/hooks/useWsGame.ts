/**
 * React hook that binds a WS game room to the `wsGame` slice.
 *
 * Responsibilities (Phase 4):
 * - on mount: ensure connected (`useSocket`), emit `GAME:JOIN`, then wait for
 *   the pushed `GAME_STATE` (the backend sends it on join) → snapshot dispatch.
 * - subscribe to every `SERVER_EVENT_NAMES` event and route each validated
 *   envelope through `applyServerEvent` (which dedups by signature in the slice).
 * - on `connect` (including reconnects): re-emit `GAME:JOIN` and wait for the
 *   `GAME_STATE` resync.
 * - on `GAME_REMOVED` or a `GAME_ERROR` with code `GAME_NOT_FOUND`: clean the
 *   local state and notify navigation.
 * - on unmount: unsubscribe all listeners, leave the room (`GAME:LEAVE`), and
 *   let `useSocket` tear the connection down — it is the only subscriber of the
 *   shared socket here, which is the "no other subscribers" reference-counted
 *   case from the plan.
 *
 * `createEnvelopeRouter` is exported separately so the integration test can
 * drive the exact same routing logic against a real in-process Socket.IO server.
 */

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store/store";
import {
    applyServerEvent,
    clearError,
    resetWsGame,
    setConnection,
    setTrickCollect,
} from "@/store/slices/wsGameSlice";
import { DEFAULT_WS_ANIM_CONFIG, type WsAnimConfig } from "../config";
import { HUMAN_PLAYER_ID } from "@/utils/constants";
import {
    emitWithAck,
    getSocket,
    onServerEvent,
} from "../client/socketClient";
import { isServerEnvelope } from "../protocol/guards";
import type {
    GameErrorPayload,
    ServerEnvelope,
    TrickCompletedPayload,
} from "../protocol/serverEvents";
import { SERVER_EVENT_NAMES } from "../protocol/serverEvents";
import { selectError, selectSnapshot } from "../store/selectors";
import { useSocket } from "./useSocket";

const JOIN_TIMEOUT_MS = 5000;
const RESYNC_BANNER_MS = 3000;

export interface WsGameErrorInfo {
    code: string;
    message: string;
    gameId?: string;
}

export interface UseWsGameOptions {
    gameId: string;
    playerId?: string;
    /** Socket URL override (used by tests); defaults to the singleton URL. */
    url?: string;
    /** Called when the game is gone (GAME_REMOVED / GAME_NOT_FOUND). */
    onGameRemoved?: () => void;
    /** Called for any GAME_ERROR payload. */
    onError?: (error: WsGameErrorInfo) => void;
}

export interface UseWsGameResult {
    connected: boolean;
    reconnecting: boolean;
    /** True once a GAME_STATE for `gameId` has populated the snapshot. */
    joined: boolean;
    error: WsGameErrorInfo | null;
    /**
     * True for a short window after a reconnect completes, so the UI can show
     * a transient "Reconnected — resynced" indicator.
     */
    resynced: boolean;
}

export interface EnvelopeRouterHandlers {
    onGameRemoved: () => void;
    onError: (error: WsGameErrorInfo) => void;
}

export interface EnvelopeRouter {
    handleEnvelope: (envelope: ServerEnvelope) => void;
    handleRawError: (raw: unknown) => void;
}

/**
 * Normalizes a GAME_ERROR into `{ code, message, gameId? }`.
 *
 * The backend pushes GAME_ERROR as a *raw* payload (`{ code, message, gameId? }`)
 * from `socket.emit`, so it does not pass the `isServerEnvelope` guard — this
 * normalizer accepts both the raw payload and a fully enveloped GAME_ERROR.
 */
export function normalizeGameError(raw: unknown): WsGameErrorInfo | null {
    if (isServerEnvelope(raw) && raw.type === "GAME_ERROR") {
        return normalizeGameError(raw.payload);
    }
    if (typeof raw === "object" && raw !== null) {
        const record = raw as Record<string, unknown>;
        if (
            typeof record.code === "string" &&
            typeof record.message === "string"
        ) {
            return {
                code: record.code,
                message: record.message,
                gameId:
                    typeof record.gameId === "string"
                        ? record.gameId
                        : undefined,
            };
        }
    }
    return null;
}

export function createEnvelopeRouter(
    dispatch: AppDispatch,
    handlers: EnvelopeRouterHandlers,
    config: WsAnimConfig = DEFAULT_WS_ANIM_CONFIG
): EnvelopeRouter {
    const queue: ServerEnvelope[] = [];
    let isProcessing = false;
    let cancelled = false;
    const importMetaEnv: Record<string, string | undefined> =
        (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
    const processEnv: Record<string, string | undefined> =
        typeof globalThis !== "undefined"
            ? (globalThis as { process?: { env?: Record<string, string | undefined> } })
                .process?.env ?? {}
            : {};
    const skipQueueWaits = Boolean(
        processEnv.VITEST ||
        processEnv.NODE_ENV === "test" ||
        importMetaEnv.MODE === "test"
    );
    const shouldWait = (ms: number) => ms > 0 && !skipQueueWaits;

    const wait = (ms: number) =>
        new Promise((resolve) => {
            if (ms <= 0 || cancelled) {
                resolve(null);
                return;
            }
            const timer = setTimeout(resolve, ms);
            if (cancelled) {
                clearTimeout(timer);
                resolve(null);
            }
        });

    const processQueue = async () => {
        if (isProcessing) return;
        isProcessing = true;

        while (queue.length > 0 && !cancelled) {
            const envelope = queue.shift()!;

            switch (envelope.type) {
                case "TRUMP_DECLARED": {
                    dispatch(applyServerEvent(envelope));
                    if (shouldWait(config.trumpModalMs)) await wait(config.trumpModalMs);
                    break;
                }

                case "CARD_PLAYED":
                case "BOT_PLAY": {
                    dispatch(applyServerEvent(envelope));
                    if (shouldWait(config.cardPlayMs)) await wait(config.cardPlayMs);
                    break;
                }

                case "TRICK_COMPLETED": {
                    // REST pattern: collect animation first, then clear cards & show modal
                    const winnerId = (envelope.payload as TrickCompletedPayload).winnerPlayerId ?? (envelope.payload as TrickCompletedPayload).trickWinner?.id;
                    if (winnerId) {
                        dispatch(setTrickCollect(winnerId));
                        if (shouldWait(config.cardPlayMs)) await wait(config.cardPlayMs);
                    }
                    dispatch(applyServerEvent(envelope));
                    dispatch(setTrickCollect(null));
                    if (shouldWait(config.trickModalMs)) await wait(config.trickModalMs);
                    break;
                }

                case "ROUND_COMPLETED": {
                    dispatch(applyServerEvent(envelope));
                    if (shouldWait(config.roundModalMs)) await wait(config.roundModalMs);
                    break;
                }

                case "ROUND_STARTED": {
                    dispatch(applyServerEvent(envelope));
                    if (shouldWait(config.dealingMs)) await wait(config.dealingMs);
                    break;
                }

                case "MATCH_COMPLETED": {
                    dispatch(applyServerEvent(envelope));
                    break;
                }

                default: {
                    dispatch(applyServerEvent(envelope));
                    break;
                }
            }
        }

        isProcessing = false;
    };

    const applyGameError = (error: WsGameErrorInfo): void => {
        cancelled = true;
        queue.length = 0;
        isProcessing = false;
        const envelope: ServerEnvelope = {
            type: "GAME_ERROR",
            payload: error as GameErrorPayload,
            timestamp: Date.now(),
        };
        dispatch(applyServerEvent(envelope));
        handlers.onError(error);
        if (error.code === "GAME_NOT_FOUND") {
            dispatch(resetWsGame());
            handlers.onGameRemoved();
        }
    };

    return {
        handleEnvelope: (envelope) => {
            if (envelope.type === "GAME_REMOVED") {
                cancelled = true;
                queue.length = 0;
                isProcessing = false;
                dispatch(resetWsGame());
                handlers.onGameRemoved();
                return;
            }
            if (envelope.type === "GAME_ERROR") {
                const error = normalizeGameError(envelope.payload) ?? {
                    code: "UNKNOWN",
                    message: "Unknown game error",
                };
                applyGameError(error);
                return;
            }
            if (envelope.type === "GAME_STATE") {
                queue.length = 0;
                isProcessing = false;
                dispatch(applyServerEvent(envelope));
                return;
            }

            queue.push(envelope);
            processQueue();
        },
        handleRawError: (raw) => {
            const error = normalizeGameError(raw);
            if (error) {
                applyGameError(error);
            }
        },
    };
}

export function useWsGame(options: UseWsGameOptions): UseWsGameResult {
    const { gameId, playerId = HUMAN_PLAYER_ID, url } = options;
    const dispatch = useDispatch<AppDispatch>();
    const { status } = useSocket(url);
    const snapshot = useSelector(selectSnapshot);
    const storeError = useSelector(selectError);

    const [resynced, setResynced] = useState(false);
    const resyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevStatusRef = useRef(status);
    useEffect(() => {
        const prev = prevStatusRef.current;
        prevStatusRef.current = status;
        if (prev === "reconnecting" && status === "connected") {
            setResynced(true);
            if (resyncTimerRef.current !== null) {
                clearTimeout(resyncTimerRef.current);
            }
            resyncTimerRef.current = setTimeout(
                () => setResynced(false),
                RESYNC_BANNER_MS
            );
        }
    }, [status]);
    useEffect(
        () => () => {
            if (resyncTimerRef.current !== null) {
                clearTimeout(resyncTimerRef.current);
            }
        },
        []
    );

    const handlersRef = useRef({
        onGameRemoved: options.onGameRemoved,
        onError: options.onError,
    });
    useEffect(() => {
        handlersRef.current = {
            onGameRemoved: options.onGameRemoved,
            onError: options.onError,
        };
    }, [options.onGameRemoved, options.onError]);

    const joined = snapshot?.gameId === gameId;
    const connected = status === "connected";
    const reconnecting = status === "reconnecting";

    useEffect(() => {
        dispatch(setConnection(status));
    }, [status, dispatch]);

    useEffect(() => {
        dispatch(resetWsGame());

        const router = createEnvelopeRouter(dispatch, {
            onGameRemoved: () => handlersRef.current.onGameRemoved?.(),
            onError: (error) => handlersRef.current.onError?.(error),
        });

        const unsubscribes = SERVER_EVENT_NAMES.map((event) =>
            onServerEvent(event, (_payload, envelope) =>
                router.handleEnvelope(envelope)
            )
        );

        const socket = getSocket();

        let joinInFlight = false;
        // Epoch guards against stale join acks: if the socket drops while a
        // join is in flight and reconnects, the old ack (TIMEOUT or late reply)
        // must not clobber the state of the fresh join attempt.
        let joinEpoch = 0;
        const emitJoin = (): void => {
            if (joinInFlight) {
                return;
            }
            joinInFlight = true;
            const epoch = ++joinEpoch;
            emitWithAck(
                "GAME:JOIN",
                { gameId, playerId },
                JOIN_TIMEOUT_MS
            ).then((ack) => {
                if (epoch !== joinEpoch) {
                    // A newer join attempt superseded this one.
                    return;
                }
                joinInFlight = false;
                if (ack.ok) {
                    dispatch(clearError());
                    return;
                }
                const error = ack.error ?? {
                    code: "UNKNOWN",
                    message: "Join failed",
                };
                router.handleRawError({
                    code: error.code,
                    message: error.message,
                    gameId: error.gameId ?? gameId,
                });
            });
        };

        const handleConnect = (): void => {
            // Invalidate any in-flight join from the previous connection so a
            // reconnect always emits a fresh GAME:JOIN and resyncs via
            // GAME_STATE instead of waiting on a dead ack.
            joinEpoch += 1;
            joinInFlight = false;
            emitJoin();
        };

        socket.on("GAME_ERROR", router.handleRawError);
        socket.on("connect", handleConnect);
        if (socket.connected) {
            emitJoin();
        }

        return () => {
            unsubscribes.forEach((off) => off());
            socket.off("GAME_ERROR", router.handleRawError);
            socket.off("connect", handleConnect);
            // Fire-and-forget: leave the room if the socket is still up (the
            // backend also cleans up on socket disconnect). No ack + no timeout
            // so no timer is left dangling in tests or on a closed socket.
            socket.emit("GAME:LEAVE", { gameId });
            dispatch(resetWsGame());
        };
    }, [gameId, playerId, url, dispatch]);

    return {
        connected,
        reconnecting,
        joined,
        error: storeError,
        resynced,
    };
}
