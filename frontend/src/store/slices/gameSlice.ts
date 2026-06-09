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
    trickWinner: string | null;
    roundWinner: string | null;
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
} = slice.actions;
export default slice.reducer;