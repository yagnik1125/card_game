import gameReducer, {
    resetGameState,
    setAnimating,
    setDealing,
    setLoading,
    setLoadError,
    setPlayError,
    setRoundWinner,
    setRoundWinnerTeam,
    setSnapshot,
    setTrickCards,
    setTrickCollect,
    setTrickWinner,
    setTrickWinnerTeam,
    setTrumpDeclaration,
    setWinner,
    setWinnerPlayerId,
    setWinnerTeam,
} from "@/store/slices/gameSlice";

const snapshot = { gameId: "g1" };

describe("gameSlice", () => {
    it("has the expected initial state", () => {
        const state = gameReducer(undefined, { type: "@@init" });
        expect(state).toEqual({
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
        });
    });

    it("sets load and play errors", () => {
        let state = gameReducer(undefined, setLoadError(true));
        expect(state.loadError).toBe(true);
        state = gameReducer(state, setPlayError("Illegal move"));
        expect(state.playError).toBe("Illegal move");
    });

    it("sets snapshot", () => {
        const state = gameReducer(undefined, setSnapshot(snapshot));
        expect(state.snapshot).toEqual(snapshot);
    });

    it("sets trick cards", () => {
        const cards = [{ playerId: "P1", suit: "HEARTS", rank: 14 }];
        const state = gameReducer(undefined, setTrickCards(cards));
        expect(state.trickCards).toEqual(cards);
    });

    it("sets the trick collect target player", () => {
        let state = gameReducer(undefined, setTrickCollect("P2"));
        expect(state.trickCollect).toBe("P2");
        state = gameReducer(state, setTrickCollect(null));
        expect(state.trickCollect).toBeNull();
    });

    it("sets animation flags", () => {
        let state = gameReducer(undefined, setAnimating(true));
        expect(state.animating).toBe(true);
        state = gameReducer(state, setDealing(true));
        expect(state.dealing).toBe(true);
        state = gameReducer(state, setLoading(true));
        expect(state.loading).toBe(true);
    });

    it("sets winner and winner player id", () => {
        let state = gameReducer(undefined, setWinner(snapshot));
        expect(state.winner).toEqual(snapshot);
        state = gameReducer(state, setWinnerPlayerId("P2"));
        expect(state.winnerPlayerId).toBe("P2");
    });

    it("sets trump declaration", () => {
        const state = gameReducer(undefined, setTrumpDeclaration("HEARTS"));
        expect(state.trumpDeclaration).toBe("HEARTS");
    });

    it("sets trick and round winners (solo)", () => {
        let state = gameReducer(undefined, setTrickWinner({ id: "P1" }));
        expect(state.trickWinner).toEqual({ id: "P1" });
        state = gameReducer(state, setRoundWinner({ id: "P1" }));
        expect(state.roundWinner).toEqual({ id: "P1" });
    });

    it("sets team winners", () => {
        let state = gameReducer(undefined, setWinnerTeam(snapshot));
        expect(state.winnerTeam).toEqual(snapshot);
        state = gameReducer(state, setTrickWinnerTeam({ id: "T1" }));
        expect(state.trickWinnerTeam).toEqual({ id: "T1" });
        state = gameReducer(state, setRoundWinnerTeam({ id: "T1" }));
        expect(state.roundWinnerTeam).toEqual({ id: "T1" });
    });

    it("resets all state on resetGameState", () => {
        const dirty = gameReducer(undefined, setSnapshot(snapshot));
        const afterTrick = gameReducer(dirty, setTrickWinner({ id: "P2" }));
        const state = gameReducer(afterTrick, resetGameState());
        expect(state).toEqual(gameReducer(undefined, { type: "@@init" }));
    });
});
