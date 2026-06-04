import {
    useEffect,
    useRef,
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
import GameBoard from "@/components/GameBoard";
import WinnerModal from "@/components/WinnerModal";

export default function GamePage() {
    const dispatch = useDispatch();
    const { gameId } = useParams();
    const snapshot = useSelector(
        (state: RootState) => state.game.snapshot
    );
    const winner = useSelector(
        (state: RootState) => state.game.winner
    );
    const trickCards = useSelector(
        (state: RootState) => state.game.trickCards
    );
    const playingRef = useRef(false);
    const load = async () => {
        if (!gameId) return;
        const view = await getView(gameId);
        dispatch(setSnapshot(view));
    };
    useEffect(() => {
        load();
    }, [gameId]);

    const handlePlay = async (cardId: string) => {
        if (!gameId) {
            return;
        }
        if (playingRef.current) {
            return;
        }
        playingRef.current = true;
        dispatch(
            setAnimating(true)
        );
        try {
            const result = await playTurn(gameId, "P1", cardId);
            let cards: any[] = [...trickCards];
            for (const event of result.events) {
                if (event.type === "CARD_PLAYED" || event.type === "BOT_PLAY") {
                    cards.push({
                        playerId: event.playerId,
                        suit: event.suit,
                        rank: event.rank,
                    });

                    dispatch(
                        setTrickCards([...cards])
                    );

                    await new Promise(r => setTimeout(r, 1000));
                }
                if (event.type === "TRICK_COMPLETED") {
                    await new Promise(r => setTimeout(r, 1000));
                    dispatch(
                        setTrickCards([])
                    );
                    cards = [];
                }
                
            }

            dispatch(
                setSnapshot(result.snapshot)
            );

            if (result.snapshot.completed) {
                dispatch(
                    setWinner(result.snapshot)
                );
            }
        } catch (error) {
            console.error(error);
            alert("Failed to play card");
        } finally {
            playingRef.current = false;
            dispatch(
                setAnimating(false)
            );
        }
    };

    if (!snapshot) {
        return <div>
            Loading...
        </div>
    }

    return (
        <>
            <GameBoard
                snapshot={snapshot}
                onPlay={handlePlay}
            />

            {winner && <WinnerModal
                winner={winner}
            />}
        </>
    )
}