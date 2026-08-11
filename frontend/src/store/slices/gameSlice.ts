import {
    createSlice,
} from "@reduxjs/toolkit";

interface GameState {
    snapshot: any | null;
    trickCards: any[];
    animating: boolean;
    dealing: boolean;
    trickCollect: string | null;
    loading: boolean;
    winner: any | null;
    winnerPlayerId: string | null;
    trumpDeclaration: string | null;
    trickWinner: any | null;
    roundWinner: any | null;
    winnerTeam: any | null;
    trickWinnerTeam: any | null;
    roundWinnerTeam: any | null;
    loadError: boolean;
    playError: string | null;
}
const initialState: GameState = {
    snapshot: null,
    trickCards: [],
    animating: false,
    dealing: false,
    trickCollect: null,
    loading: false,
    winner: null,
    winnerPlayerId: null,
    trumpDeclaration: null,
    trickWinner: null,
    roundWinner: null,
    winnerTeam: null,
    trickWinnerTeam: null,
    roundWinnerTeam: null,
    loadError: false,
    playError: null,
};
const slice =
    createSlice({
        name: "game",
        initialState,
        reducers: {
            resetGameState() {
                return initialState;
            },
            setSnapshot(state, action) {
                state.snapshot = action.payload;
            },
            setTrickCards(state, action) {
                state.trickCards = action.payload;
            },
            setAnimating(state, action) {
                state.animating = action.payload;
            },
            setWinner(state, action) {
                state.winner = action.payload;
            },
            setWinnerPlayerId(state, action) {
                state.winnerPlayerId = action.payload;
            },
            setLoading(state, action) {
                state.loading = action.payload;
            },
            setDealing(state, action) {
                state.dealing = action.payload;
            },
            setTrickCollect(state, action) {
                state.trickCollect = action.payload;
            },
            setTrumpDeclaration(state, action) {
                state.trumpDeclaration = action.payload;
            },
            setTrickWinner(state, action) {
                state.trickWinner = action.payload;
            },
            setRoundWinner(state, action) {
                state.roundWinner = action.payload;
            },
            setWinnerTeam(state, action) {
                state.winnerTeam = action.payload;
            },
            setTrickWinnerTeam(state, action) {
                state.trickWinnerTeam = action.payload;
            },
            setRoundWinnerTeam(state, action) {
                state.roundWinnerTeam = action.payload;
            },
            setLoadError(state, action) {
                state.loadError = action.payload;
            },
            setPlayError(state, action) {
                state.playError = action.payload;
            },
        }
    });

export const {
    resetGameState,
    setSnapshot,
    setTrickCards,
    setAnimating,
    setWinner,
    setWinnerPlayerId,
    setLoading,
    setDealing,
    setTrickCollect,
    setTrumpDeclaration,
    setTrickWinner,
    setRoundWinner,
    setWinnerTeam,
    setTrickWinnerTeam,
    setRoundWinnerTeam,
    setLoadError,
    setPlayError,
} = slice.actions;
export default slice.reducer;