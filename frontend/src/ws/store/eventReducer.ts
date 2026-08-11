/**
 * Pure event reducer: maps one server envelope to a state patch.
 *
 * No socket or React imports — this is the single place where envelope
 * payloads become `wsGame` state transitions, including dedup by identity
 * signature and snapshot resync.
 */

import { HUMAN_PLAYER_ID } from "../../utils/constants";
import { mapGameError } from "../utils/errors";
import type { ConnectionStatus } from "../client/connection";
import {
    cardPlayToTrickCard,
    viewToTrickCards,
    type TrickCard,
} from "../dto/normalizers";
import { isGameView, type GameView } from "../dto/gameView";
import type {
    RoundWinner,
    RoundWinnerTeam,
    TrickWinner,
    TrickWinnerTeam,
} from "../dto/winners";
import type {
    ServerEnvelope,
    ServerEvent,
    ServerEventName,
} from "../protocol/serverEvents";

export interface WsGameState {
    connection: ConnectionStatus;
    snapshot: GameView | null;
    trickCards: TrickCard[];
    turnNumber: number;
    animating: boolean;
    dealing: boolean;
    loading: boolean;
    trumpDeclaration: string | null;
    trickWinner: TrickWinner | null;
    trickWinnerTeam: TrickWinnerTeam | null;
    roundWinner: RoundWinner | null;
    roundWinnerTeam: RoundWinnerTeam | null;
    winnerPlayerId: string | null;
    winnerTeamId: string | null;
    error: { code: string; message: string } | null;
    lastSignature: string | null;
    /**
     * Monotonic counter bumped on every GAME_STATE resync. The animator uses
     * it to drop queued timers and re-baseline so a resync never re-animates
     * trick cards that already exist in the snapshot.
     */
    stateVersion: number;
    /** True when a second (non-human) client is watching the room. */
    watching: boolean;
}

export type WsGameStatePatch = Partial<WsGameState>;

export const wsGameInitialState: WsGameState = {
    connection: "idle",
    snapshot: null,
    trickCards: [],
    turnNumber: 0,
    animating: false,
    dealing: false,
    loading: false,
    trumpDeclaration: null,
    trickWinner: null,
    trickWinnerTeam: null,
    roundWinner: null,
    roundWinnerTeam: null,
    winnerPlayerId: null,
    winnerTeamId: null,
    error: null,
    lastSignature: null,
    stateVersion: 0,
    watching: false,
};

type PayloadOf<T extends ServerEventName> = Extract<
    ServerEvent,
    { type: T }
>["payload"];

type TypedServerEnvelope = {
    [T in ServerEventName]: ServerEnvelope<PayloadOf<T>> & { type: T };
}[ServerEventName];

function eventSignature(envelope: ServerEnvelope): string | null {
    const typed = envelope as TypedServerEnvelope;
    switch (typed.type) {
        case "CARD_PLAYED":
        case "BOT_PLAY":
            return `${typed.type}:${typed.payload.playerId}:${typed.payload.cardId}`;
        case "TURN_CHANGED":
            return `${typed.type}:${typed.payload.turnNumber}:${typed.payload.currentPlayerId}`;
        case "TRUMP_DECLARED":
            return `${typed.type}:${typed.payload.playerId}:${typed.payload.suit ?? "none"}`;
        case "TRICK_COMPLETED":
            return `${typed.type}:${typed.payload.trickNumber}:${typed.payload.winnerPlayerId ?? "none"}`;
        case "ROUND_COMPLETED":
            return `${typed.type}:${typed.payload.roundNumber}:${typed.payload.winnerPlayerId ?? "none"}`;
        case "MATCH_COMPLETED":
            return `${typed.type}:${typed.payload.winnerPlayerId ?? typed.payload.winnerTeamId ?? "none"}`;
        case "ROUND_STARTED":
            return `${typed.type}:${typed.payload.roundNumber}`;
        case "GAME_STATE": {
            if (isGameView(envelope.snapshot)) {
                return `${typed.type}:${envelope.snapshot.roundNumber}:${envelope.snapshot.currentPlayerId}:${envelope.snapshot.currentTrick.plays.length}`;
            }
            return null;
        }
        default:
            return null;
    }
}

function withSignature(
    patch: WsGameStatePatch,
    signature: string | null
): WsGameStatePatch {
    return signature === null
        ? patch
        : { ...patch, lastSignature: signature };
}

function applySnapshot(
    patch: WsGameStatePatch,
    snapshot: unknown
): void {
    if (isGameView(snapshot)) {
        patch.snapshot = snapshot;
    }
}

function removeFromHand(snapshot: GameView, cardId: string): GameView {
    const human = snapshot.players.find((p) => p.id === HUMAN_PLAYER_ID);
    if (!human?.hand) {
        return snapshot;
    }
    return {
        ...snapshot,
        players: snapshot.players.map((p) =>
            p.id === HUMAN_PLAYER_ID && p.hand
                ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) }
                : p
        ),
    };
}

export function reduceServerEvent(
    state: WsGameState,
    envelope: ServerEnvelope
): WsGameStatePatch {
    const signature = eventSignature(envelope);
    if (signature !== null && signature === state.lastSignature) {
        return {};
    }
    const typed = envelope as TypedServerEnvelope;

    switch (typed.type) {
        case "CARD_PLAYED":
        case "BOT_PLAY": {
            // Stale-event guard: after a GAME_STATE resync the snapshot is the
            // source of truth. A play that is already reflected in the rebuilt
            // trick cards or in the snapshot's current trick must not be
            // re-applied (it would double-render the card and re-trigger the
            // hand animation).
            const play = typed.payload;
            const alreadyInTrick = state.trickCards.some(
                (c) =>
                    c.playerId === play.playerId &&
                    c.suit === play.suit &&
                    c.rank === play.rank
            );
            const alreadyInSnapshot =
                !!state.snapshot &&
                state.snapshot.currentTrick.plays.some(
                    (p) =>
                        p.playerId === play.playerId &&
                        p.card.suit === play.suit &&
                        p.card.rank === play.rank
                );
            if (alreadyInTrick || alreadyInSnapshot) {
                return {};
            }
            const patch: WsGameStatePatch = {
                trickCards: [
                    ...state.trickCards,
                    cardPlayToTrickCard(typed.payload),
                ],
            };
            if (
                typed.payload.playerId === HUMAN_PLAYER_ID &&
                state.snapshot
            ) {
                patch.snapshot = removeFromHand(
                    state.snapshot,
                    typed.payload.cardId
                );
            }
            return withSignature(patch, signature);
        }
        case "TURN_CHANGED": {
            const snapshot = state.snapshot
                ? {
                      ...state.snapshot,
                      currentPlayerId: typed.payload.currentPlayerId,
                  }
                : state.snapshot;
            return withSignature(
                { snapshot, turnNumber: typed.payload.turnNumber },
                signature
            );
        }
        case "TRUMP_DECLARED":
            return withSignature(
                { trumpDeclaration: typed.payload.suit },
                signature
            );
        case "TRICK_COMPLETED": {
            // Stale-terminal guard: after a resync the snapshot has already
            // advanced past this trick (same-round trick numbers only; the
            // signature dedup already covers exact re-deliveries) — do not
            // re-show the winner modal.
            const snap = state.snapshot;
            const staleTrick =
                !!snap &&
                snap.currentTrick.trickNumber > typed.payload.trickNumber;
            if (staleTrick) {
                return withSignature({}, signature);
            }
            const patch: WsGameStatePatch = {
                trickCards: [],
                trickWinner: typed.payload.trickWinner,
                trickWinnerTeam: typed.payload.trickWinnerTeam ?? null,
            };
            applySnapshot(patch, envelope.snapshot);
            return withSignature(patch, signature);
        }
        case "ROUND_COMPLETED": {
            const roundSnap = state.snapshot;
            if (
                !!roundSnap &&
                roundSnap.roundNumber > typed.payload.roundNumber
            ) {
                return withSignature({}, signature);
            }
            const patch: WsGameStatePatch = {
                dealing: true,
                roundWinner: typed.payload.roundWinner ?? null,
                roundWinnerTeam: typed.payload.roundWinnerTeam ?? null,
            };
            applySnapshot(patch, envelope.snapshot);
            return withSignature(patch, signature);
        }
        case "MATCH_COMPLETED": {
            const patch: WsGameStatePatch = {
                winnerPlayerId: typed.payload.winnerPlayerId ?? null,
                winnerTeamId: typed.payload.winnerTeamId ?? null,
            };
            applySnapshot(patch, envelope.snapshot);
            return withSignature(patch, signature);
        }
        case "ROUND_STARTED": {
            const snapshot = state.snapshot
                ? {
                      ...state.snapshot,
                      roundNumber: typed.payload.roundNumber,
                      champion: typed.payload.championPlayerId,
                      championTeam: typed.payload.championTeamId,
                  }
                : state.snapshot;
            return withSignature({ dealing: true, snapshot }, signature);
        }
        case "GAME_STATE": {
            if (!isGameView(envelope.snapshot)) {
                return withSignature({}, signature);
            }
            return withSignature(
                {
                    snapshot: envelope.snapshot,
                    trickCards: viewToTrickCards(envelope.snapshot),
                    animating: false,
                    dealing: false,
                    stateVersion: (state.stateVersion ?? 0) + 1,
                },
                signature
            );
        }
        case "GAME_JOINED":
            return {
                watching: typed.payload.playerId !== HUMAN_PLAYER_ID,
            };
        case "GAME_LEFT":
            return {
                watching:
                    typed.payload.playerId !== HUMAN_PLAYER_ID
                        ? false
                        : state.watching,
            };
        case "GAME_ERROR":
            return {
                error: mapGameError({
                    code: typed.payload.code,
                    message: typed.payload.message,
                }),
            };
        default:
            return {};
    }
}
