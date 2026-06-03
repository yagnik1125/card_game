import {
    createSlice,
} from "@reduxjs/toolkit";

interface GameState {
    snapshot: any | null;
    trickCards: any[];
    animating: boolean;
    loading: boolean;
    winner: any | null;
}
const initialState: GameState = {
    snapshot: null,
    trickCards: [],
    animating: false,
    loading: false,
    winner: null,
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
            }
        }
    });

export const {
    setSnapshot,
    setTrickCards,
    setAnimating,
    setWinner,
    setLoading,
} = slice.actions;
export default slice.reducer;