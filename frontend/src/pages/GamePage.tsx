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
    setDealing,
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
        const trickCards = view.currentTrick.plays.map((play: any) => ({
            playerId: play.playerId,
            suit: play.card.suit,
            rank: play.card.rank
        }));
        dispatch(setTrickCards(trickCards));
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
            const updatedSnapshot = {
                ...snapshot,
                players: snapshot.players.map((p: any) =>
                    p.id === "P1" ? { ...p, hand: p.hand.filter((c: any) => c.id !== cardId) } : p
                )
            };
            dispatch(setSnapshot(updatedSnapshot));
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

                    await new Promise(r => setTimeout(r, 700));
                }
                if (event.type === "TRICK_COMPLETED") {
                    await new Promise(r => setTimeout(r, 700));
                    dispatch(
                        setTrickCards([])
                    );
                    cards = [];
                }
                if (event.type === "ROUND_COMPLETED") {
                    dispatch(setDealing(true));
                    dispatch(
                        setSnapshot(result.snapshot)
                    );
                    await new Promise(r => setTimeout(r, 1500));
                    dispatch(setDealing(false));
                }
                if (event.type === "MATCH_COMPLETED") {
                    await new Promise(r => setTimeout(r, 1200));
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