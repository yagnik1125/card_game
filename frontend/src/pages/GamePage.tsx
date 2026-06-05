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
import GameLoader from "@/components/GameLoader";

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
        // dispatch(setSnapshot(view));
        dispatch(setDealing(true));
        await new Promise(r => setTimeout(r, 1500));
        dispatch(setTrickCards(trickCards));
        dispatch(setSnapshot(view));
        await new Promise(r => requestAnimationFrame(() => r(null)));
        dispatch(setDealing(false));
        await new Promise(r => setTimeout(r, 1600));
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
            let latestSnapshot = snapshot;
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
                    latestSnapshot = {
                        ...latestSnapshot,
                        currentPlayerId: event.playerId,
                        players: latestSnapshot.players.map(
                            (p: any) => p.id === "P1" && event.playerId === "P1"
                                ? { ...p, hand: p.hand.filter((c: any) => c.id !== event.cardId) }
                                : p
                        )
                    };
                    dispatch(
                        setSnapshot(latestSnapshot)
                    );
                    await new Promise(r => setTimeout(r, 700));
                }
                if (event.type === "TRICK_COMPLETED") {
                    await new Promise(r => setTimeout(r, 700));
                    dispatch(setTrickCards([]));
                    cards = [];
                    await new Promise(r => requestAnimationFrame(() => r(null)));
                    latestSnapshot = result.snapshot;
                    dispatch(
                        setSnapshot({
                            ...latestSnapshot,
                            currentPlayerId: event.playerId
                        })
                    );
                }
                if (event.type === "ROUND_COMPLETED") {
                    await new Promise(r => setTimeout(r, 700));
                    dispatch(setTrickCards([]));
                    cards = [];
                    await new Promise(r => setTimeout(r, 500));
                    dispatch(setDealing(true));
                    await new Promise(r => setTimeout(r, 1500));
                    latestSnapshot = result.snapshot;
                    dispatch(
                        setSnapshot({
                            ...latestSnapshot,
                            currentPlayerId: event.playerId
                        })
                    );
                    await new Promise(r => requestAnimationFrame(() => r(null)));
                    dispatch(setDealing(false));
                    await new Promise(r => setTimeout(r, 1600));
                }
                if (event.type === "MATCH_COMPLETED") {
                    await new Promise(r => setTimeout(r, 700));
                    dispatch(setTrickCards([]));
                    cards = [];
                    latestSnapshot = result.snapshot;
                    dispatch(
                        setSnapshot({
                            ...latestSnapshot,
                            currentPlayerId: event.playerId
                        })
                    );
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
        return <GameLoader />;
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