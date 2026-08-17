/**
 * Animation orchestration for the WS game, driven purely by `wsGame` store
 * state (no socket access). Each piece of transient state — dealing, trick-card
 * placement, modal visibility — is cleared after a configurable delay, mirroring
 * the REST pages' pacing:
 *
 * - ROUND_STARTED / ROUND_COMPLETED → dealing runs for `dealingMs` (1600ms).
 * - CARD_PLAYED / BOT_PLAY → the hand is held in `animating` for `cardPlayMs`
 *   (700ms) after the last trick card lands.
 * - TRUMP_DECLARED → modal stays `trumpModalMs` (2s).
 * - TRICK_COMPLETED → modal stays `trickModalMs` (1s).
 * - ROUND_COMPLETED → modal stays `roundModalMs` (2s).
 * - MATCH_COMPLETED → winner modal is persistent (dismissed by the page).
 *
 * All timers live in a single ref map so they can be cleared on unmount, on
 * `resetWsGame`, or when the active game changes — no leaked `setTimeout`.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
    setAnimating,
    setDealing,
    setRoundWinner,
    setRoundWinnerTeam,
    setTrumpDeclaration,
    setTrickWinner,
    setTrickWinnerTeam,
} from "@/store/slices/wsGameSlice";
import { DEFAULT_WS_ANIM_CONFIG, type WsAnimConfig } from "../config";
import {
    selectDealing,
    selectRoundWinner,
    selectRoundWinnerTeam,
    selectStateVersion,
    selectTrumpDeclaration,
    selectTrickWinner,
    selectTrickWinnerTeam,
} from "../store/selectors";

type TimerHandle = ReturnType<typeof setTimeout>;

export function useWsAnimator(config?: Partial<WsAnimConfig>): void {
    const dispatch = useDispatch();
    const timersRef = useRef<Map<string, TimerHandle>>(new Map());
    const cfg = useMemo<WsAnimConfig>(
        () => ({ ...DEFAULT_WS_ANIM_CONFIG, ...config }),
        [config]
    );

    const clearTimers = useCallback(() => {
        timersRef.current.forEach((timer) => clearTimeout(timer));
        timersRef.current.clear();
    }, []);

    const arm = useCallback((key: string, ms: number, fn: () => void) => {
        const existing = timersRef.current.get(key);
        if (existing !== undefined) {
            clearTimeout(existing);
        }
        timersRef.current.set(
            key,
            setTimeout(() => {
                timersRef.current.delete(key);
                fn();
            }, ms)
        );
    }, []);

    // Timers are scoped to one game: drop them when the active game changes
    // (navigation, reset, or reconnect into a different session).
    const gameId = useSelector(
        (state: RootState) => state.wsGame.snapshot?.gameId ?? null
    );
    const prevGameId = useRef(gameId);
    useEffect(() => {
        if (gameId !== prevGameId.current) {
            clearTimers();
            prevGameId.current = gameId;
        }
    }, [gameId, clearTimers]);

    // A GAME_STATE resync is the source-of-truth reconciliation (snapshot,
    // trick cards rebuilt from `currentTrick.plays`, animating/dealing reset).
    // It must drop any queued animation timers and re-baseline the tracking
    // refs so rebuilt cards and the dealing state are never re-animated.
    const dealing = useSelector(selectDealing);
    const trickCount = useSelector(
        (state: RootState) => state.wsGame.trickCards.length
    );
    const stateVersion = useSelector(selectStateVersion);
    const prevStateVersion = useRef(stateVersion);
    const prevDealing = useRef<boolean | undefined>(undefined);
    const prevTrickCount = useRef<number | undefined>(undefined);
    useEffect(() => {
        if (stateVersion !== prevStateVersion.current) {
            prevStateVersion.current = stateVersion;
            clearTimers();
            prevTrickCount.current = trickCount;
            prevDealing.current = undefined;
        }
    }, [stateVersion, trickCount, clearTimers]);

    const roundWinner = useSelector(selectRoundWinner);
    const roundWinnerTeam = useSelector(selectRoundWinnerTeam);

    // Dealing: arm once on a false → true transition so a flood of card events
    // during the animation cannot keep extending it.
    useEffect(() => {
        if (dealing && prevDealing.current !== true) {
            arm("dealing", cfg.dealingMs, () => dispatch(setDealing(false)));
        }
        prevDealing.current = dealing;
    }, [dealing, cfg.dealingMs, arm, dispatch]);

    // Trick-card placement: hold `animating` for cardPlayMs after the last
    // appended card so the hand cannot be clicked mid-stream.
    useEffect(() => {
        if (trickCount > (prevTrickCount.current ?? 0)) {
            dispatch(setAnimating(true));
            arm("cardPlay", cfg.cardPlayMs, () =>
                dispatch(setAnimating(false))
            );
        }
        prevTrickCount.current = trickCount;
    }, [trickCount, cfg.cardPlayMs, arm, dispatch]);

    // Modals: clear each after its configured duration.
    const trumpDeclaration = useSelector(selectTrumpDeclaration);
    useEffect(() => {
        if (trumpDeclaration) {
            arm("trump", cfg.trumpModalMs, () =>
                dispatch(setTrumpDeclaration(null))
            );
        }
    }, [trumpDeclaration, cfg.trumpModalMs, arm, dispatch]);

    const trickWinner = useSelector(selectTrickWinner);
    useEffect(() => {
        if (trickWinner) {
            arm("trick", cfg.trickModalMs, () =>
                dispatch(setTrickWinner(null))
            );
        }
    }, [trickWinner, cfg.trickModalMs, arm, dispatch]);

    const trickWinnerTeam = useSelector(selectTrickWinnerTeam);
    useEffect(() => {
        if (trickWinnerTeam) {
            arm("trickTeam", cfg.trickModalMs, () =>
                dispatch(setTrickWinnerTeam(null))
            );
        }
    }, [trickWinnerTeam, cfg.trickModalMs, arm, dispatch]);

    useEffect(() => {
        if (roundWinner) {
            arm("round", cfg.roundModalMs, () =>
                dispatch(setRoundWinner(null))
            );
        }
    }, [roundWinner, cfg.roundModalMs, arm, dispatch]);

    useEffect(() => {
        if (roundWinnerTeam) {
            arm("roundTeam", cfg.roundModalMs, () =>
                dispatch(setRoundWinnerTeam(null))
            );
        }
    }, [roundWinnerTeam, cfg.roundModalMs, arm, dispatch]);

    // Unmount cleanup — no leaked timers.
    useEffect(() => () => clearTimers(), [clearTimers]);
}
