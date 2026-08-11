import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import { HUMAN_PLAYER_ID } from "@/utils/constants";
import type { ConnectionStatus } from "@/ws/client/connection";
import type { GameView } from "@/ws/dto/gameView";
import type {
    RoundWinner,
    RoundWinnerTeam,
    TrickWinner,
    TrickWinnerTeam,
} from "@/ws/dto/winners";
import type { TrickCard } from "@/ws/dto/normalizers";
import type { WsGameState } from "@/ws/store/eventReducer";

const selectWsGame = (state: RootState): WsGameState => state.wsGame;

export const selectSnapshot = (state: RootState): GameView | null =>
    selectWsGame(state).snapshot;

export const selectConnection = (state: RootState): ConnectionStatus =>
    selectWsGame(state).connection;

export const selectTrickCards = (state: RootState): TrickCard[] =>
    selectWsGame(state).trickCards;

export const selectTurnNumber = (state: RootState): number =>
    selectWsGame(state).turnNumber;

export const selectDealing = (state: RootState): boolean =>
    selectWsGame(state).dealing;

export const selectAnimating = (state: RootState): boolean =>
    selectWsGame(state).animating;

export const selectTrumpDeclaration = (state: RootState): string | null =>
    selectWsGame(state).trumpDeclaration;

export const selectTrickWinner = (state: RootState): TrickWinner | null =>
    selectWsGame(state).trickWinner;

export const selectTrickWinnerTeam = (
    state: RootState
): TrickWinnerTeam | null => selectWsGame(state).trickWinnerTeam;

export const selectRoundWinner = (state: RootState): RoundWinner | null =>
    selectWsGame(state).roundWinner;

export const selectRoundWinnerTeam = (
    state: RootState
): RoundWinnerTeam | null => selectWsGame(state).roundWinnerTeam;

export const selectIsHumanTurn = (state: RootState): boolean =>
    selectWsGame(state).snapshot?.currentPlayerId === HUMAN_PLAYER_ID;

export const selectCanPlay = createSelector(
    [selectWsGame],
    (ws): boolean =>
        !!ws.snapshot &&
        ws.snapshot.currentPlayerId === HUMAN_PLAYER_ID &&
        !ws.animating &&
        !ws.dealing &&
        !ws.snapshot.completed
);

export const selectError = (state: RootState) => selectWsGame(state).error;

export const selectWinnerPlayerId = (state: RootState): string | null =>
    selectWsGame(state).winnerPlayerId;

export const selectWinnerTeamId = (state: RootState): string | null =>
    selectWsGame(state).winnerTeamId;

export const selectStateVersion = (state: RootState): number =>
    selectWsGame(state).stateVersion;

export const selectWatching = (state: RootState): boolean =>
    selectWsGame(state).watching;
