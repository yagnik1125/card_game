/**
 * WS frontend tuning knobs.
 *
 * Animation durations mirror the REST frontend pacing (700ms per card play,
 * 1600ms dealing, 2000ms trump/round modals, 1000ms trick modal). Each value
 * can be overridden via a VITE_WS_ANIM_* env var so tests can run fast and
 * users can tune pacing without code changes.
 */

export interface WsAnimConfig {
    /** Pacing applied after a CARD_PLAYED/BOT_PLAY appends a trick card. */
    cardPlayMs: number;
    /** How long the dealing animation runs after ROUND_STARTED/ROUND_COMPLETED. */
    dealingMs: number;
    /** How long the TRUMP_DECLARED modal stays on screen. */
    trumpModalMs: number;
    /** How long the TRICK_COMPLETED modal stays on screen. */
    trickModalMs: number;
    /** How long the ROUND_COMPLETED modal stays on screen. */
    roundModalMs: number;
}

const importMetaEnv: Record<string, string | undefined> =
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

const processEnv: Record<string, string | undefined> =
    typeof globalThis !== "undefined"
        ? (globalThis as { process?: { env?: Record<string, string | undefined> } })
              .process?.env ?? {}
        : {};

function envMs(key: string, fallback: number): number {
    const raw = processEnv[key] ?? importMetaEnv[key];
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const DEFAULT_WS_ANIM_CONFIG: WsAnimConfig = {
    cardPlayMs: envMs("VITE_WS_ANIM_CARD_MS", 700),
    dealingMs: envMs("VITE_WS_ANIM_DEALING_MS", 1600),
    trumpModalMs: envMs("VITE_WS_ANIM_TRUMP_MS", 2000),
    trickModalMs: envMs("VITE_WS_ANIM_TRICK_MS", 1000),
    roundModalMs: envMs("VITE_WS_ANIM_ROUND_MS", 2000),
};
