import {
    useEffect,
} from "react";

import {
    useDispatch,
    useSelector,
} from "react-redux";
import {
    useParams,
} from "react-router-dom";
import {
    getView,
    playTurn,
} from "@/api/gameApi";
import {
    type RootState,
} from "@/store/store";
import {
    setSnapshot,
    setAnimating,
    setTrickCards,
    setWinner,
} from "@/store/slices/gameSlice";
import GameBoard
    from "@/components/GameBoard";

export default function GamePage() {
    const dispatch = useDispatch();
    const { gameId } = useParams();
    const snapshot = useSelector(
        (state: RootState) => state.game.snapshot
    );
    const load = async () => {
        if (!gameId) return;
        const view = await getView(gameId);
        dispatch(setSnapshot(view));
    };
    useEffect(() => {
        load();
    }, []);

    const handlePlay =
        async (cardId: string) => {
            if (!gameId) return;
            dispatch(
                setAnimating(true)
            );
            const result = await playTurn(gameId, "P1", cardId);
            let cards: any[] = [];
            for (const event of result.events) {
                cards = [...cards, event];
                dispatch(
                    setTrickCards(cards)
                );
                await new Promise(r => setTimeout(r, 700));
            }
            dispatch(
                setSnapshot(
                    result.snapshot
                )
            );
            dispatch(
                setTrickCards([])
            );
            dispatch(
                setAnimating(false)
            );
            if (result.snapshot.completed) {
                dispatch(
                    setWinner(
                        result.snapshot
                    )
                );
            }
        };

    if (!snapshot) {
        return <div>
            Loading...
        </div>
    }

    return (
        <GameBoard
            snapshot={snapshot}
            onPlay={handlePlay}
        />
    )
}