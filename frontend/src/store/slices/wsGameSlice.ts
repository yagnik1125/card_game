import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ServerEnvelope } from "@/ws/protocol/serverEvents";
import type { ConnectionStatus } from "@/ws/client/connection";
import type {
    RoundWinner,
    RoundWinnerTeam,
    TrickWinner,
    TrickWinnerTeam,
} from "@/ws/dto/winners";
import {
    reduceServerEvent,
    wsGameInitialState,
} from "@/ws/store/eventReducer";

const slice = createSlice({
    name: "wsGame",
    initialState: wsGameInitialState,
    reducers: {
        resetWsGame() {
            return wsGameInitialState;
        },
        applyServerEvent(state, action: PayloadAction<ServerEnvelope>) {
            const patch = reduceServerEvent(state, action.payload);
            Object.assign(state, patch);
        },
        setConnection(state, action: PayloadAction<ConnectionStatus>) {
            state.connection = action.payload;
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setDealing(state, action: PayloadAction<boolean>) {
            state.dealing = action.payload;
        },
        setAnimating(state, action: PayloadAction<boolean>) {
            state.animating = action.payload;
        },
        setTrumpDeclaration(state, action: PayloadAction<string | null>) {
            state.trumpDeclaration = action.payload;
        },
        setTrickWinner(state, action: PayloadAction<TrickWinner | null>) {
            state.trickWinner = action.payload;
        },
        setTrickWinnerTeam(
            state,
            action: PayloadAction<TrickWinnerTeam | null>
        ) {
            state.trickWinnerTeam = action.payload;
        },
        setRoundWinner(state, action: PayloadAction<RoundWinner | null>) {
            state.roundWinner = action.payload;
        },
        setRoundWinnerTeam(
            state,
            action: PayloadAction<RoundWinnerTeam | null>
        ) {
            state.roundWinnerTeam = action.payload;
        },
        clearError(state) {
            state.error = null;
        },
    },
});

export const {
    resetWsGame,
    applyServerEvent,
    setConnection,
    setLoading,
    setDealing,
    setAnimating,
    setTrumpDeclaration,
    setTrickWinner,
    setTrickWinnerTeam,
    setRoundWinner,
    setRoundWinnerTeam,
    clearError,
} = slice.actions;

export type { WsGameState } from "@/ws/store/eventReducer";

export default slice.reducer;
