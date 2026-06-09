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
    setTrumpDeclaration,
    setTrickWinner,
    setRoundWinner,
} from "@/store/slices/gameSlice";
import GameBoard from "@/components/GameBoard";
import WinnerModal from "@/components/WinnerModal";
import GameLoader from "@/components/GameLoader";
import TrumpDeclarationModal from "@/components/TrumpDeclarationModal";
import TrickWinnerModal from "@/components/TrickWinnerModal";
import RoundWinnerModal from "@/components/RoundWinnerModal";

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
    const trumpDeclaration = useSelector(
        (state: RootState) => state.game.trumpDeclaration
    );
    const trickWinner = useSelector(
        (state: RootState) => state.game.trickWinner
    );
    const roundWinner = useSelector(
        (state: RootState) => state.game.roundWinner
    );
    const playingRef = useRef(false);

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const waitNextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    const dealing = useSelector((state: RootState) => state.game.dealing);
    const dealingRef = useRef(dealing);

    useEffect(() => {
        dealingRef.current = dealing;
    }, [dealing]);

    const waitForDealingComplete = async () => {
        while (dealingRef.current) {
            await wait(1600);
        }
    };

    const load = async () => {
        if (!gameId) return;
        const view = await getView(gameId);
        const trickCards = view.currentTrick.plays.map((play: any) => ({
            playerId: play.playerId,
            suit: play.card.suit,
            rank: play.card.rank
        }));

        dispatch(setDealing(true));
        dispatch(setTrickCards(trickCards));
        dispatch(setSnapshot(view));
        await waitNextFrame();
        await wait(1600);
        dispatch(setDealing(false));
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
                    if (event.type === "BOT_PLAY") {
                        await waitForDealingComplete();
                    }
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
                    await wait(700);
                }
                if (event.type === "TRUMP_DECLARED") {
                    latestSnapshot = {
                        ...latestSnapshot,
                        trumpSuit: result.snapshot.trumpSuit,
                    };
                    dispatch(setTrumpDeclaration(result.snapshot.trumpSuit));
                    dispatch(setSnapshot(latestSnapshot));
                    await wait(2000);
                    dispatch(setTrumpDeclaration(null));
                }
                if (event.type === "TRICK_COMPLETED") {
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
                    dispatch(setTrickWinner(event.trickWinnerId));
                    await wait(1000);
                    dispatch(setTrickWinner(null));
                }
                if (event.type === "ROUND_COMPLETED") {
                    dispatch(setDealing(true));
                    dispatch(setTrickCards([]));
                    cards = [];
                    latestSnapshot = result.snapshot;
                    dispatch(setSnapshot({ ...latestSnapshot, currentPlayerId: event.playerId }));
                    dispatch(setTrickWinner(event.trickWinnerId));
                    await wait(1000);
                    dispatch(setTrickWinner(null));
                    dispatch(setRoundWinner(event.roundWinnerId));
                    await wait(2000);
                    dispatch(setRoundWinner(null));
                    await waitNextFrame();
                    await wait(1600);
                    dispatch(setDealing(false));
                }
                if (event.type === "MATCH_COMPLETED") {
                    dispatch(setTrickCards([]));
                    cards = [];
                    latestSnapshot = result.snapshot;
                    dispatch(
                        setSnapshot({
                            ...latestSnapshot,
                            currentPlayerId: event.playerId
                        })
                    );
                    dispatch(setTrickWinner(event.trickWinnerId));
                    await wait(1000);
                    dispatch(setTrickWinner(null));
                    dispatch(setRoundWinner(event.roundWinnerId));
                    await wait(2000);
                    dispatch(setRoundWinner(null));
                    await wait(1000);
                }
            }

            dispatch(setSnapshot(result.snapshot));

            if (result.snapshot.completed) {
                dispatch(setWinner(result.snapshot));
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
                onPlay={handlePlay}
            />

            <TrumpDeclarationModal suit={trumpDeclaration} />

            <TrickWinnerModal playerId={trickWinner} />

            <RoundWinnerModal playerId={roundWinner} />

            {winner && <WinnerModal
                winner={winner}
                gameId={snapshot.gameId}
            />}
        </>
    )
}