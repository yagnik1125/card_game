import {
    createSlice,
} from "@reduxjs/toolkit";

interface GameState {
    snapshot: any | null;
    trickCards: any[];
    animating: boolean;
    dealing: boolean;
    loading: boolean;
    winner: any | null;
    trumpDeclaration: string | null;
    trickWinner: any | null;
    roundWinner: any | null;
    winnerTeam: any | null;
    trickWinnerTeam: any | null;
    roundWinnerTeam: any | null;
}
const initialState: GameState = {
    snapshot: null,
    trickCards: [],
    animating: false,
    dealing: false,
    loading: false,
    winner: null,
    trumpDeclaration: null,
    trickWinner: null,
    roundWinner: null,
    winnerTeam: null,
    trickWinnerTeam: null,
    roundWinnerTeam: null,
};
const slice =
    createSlice({
        name: "game",
        initialState,
        reducers: {
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
            setLoading(state, action) {
                state.loading = action.payload;
            },
            setDealing(state, action) {
                state.dealing = action.payload;
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
        }
    });

export const {
    setSnapshot,
    setTrickCards,
    setAnimating,
    setWinner,
    setLoading,
    setDealing,
    setTrumpDeclaration,
    setTrickWinner,
    setRoundWinner,
    setWinnerTeam,
    setTrickWinnerTeam,
    setRoundWinnerTeam,
} = slice.actions;
export default slice.reducer;