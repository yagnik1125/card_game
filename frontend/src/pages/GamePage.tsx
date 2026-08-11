import {
    useCallback,
    useEffect,
    useRef,
} from "react";

import {
    useDispatch,
    useSelector,
} from "react-redux";
import {
    useNavigate,
    useParams,
} from "react-router-dom";
import {
    getLegalMoves,
    getView,
    playTurn,
} from "@/api/gameApi";
import {
    type RootState,
} from "@/store/store";
import {
    resetGameState,
    setSnapshot,
    setAnimating,
    setDealing,
    setTrickCards,
    setWinner,
    setWinnerPlayerId,
    setTrumpDeclaration,
    setTrickWinner,
    setRoundWinner,
    setTrickCollect,
    setLoadError,
    setPlayError,
} from "@/store/slices/gameSlice";
import { HUMAN_PLAYER_ID } from "@/utils/constants";
import { extractErrorMessage } from "@/utils/errors";
import GameBoard from "@/components/solo/GameBoard";
import WinnerModal from "@/components/solo/WinnerModal";
import GameLoader from "@/components/common/GameLoader";
import TrumpDeclarationModal from "@/components/common/TrumpDeclarationModal";
import TrickWinnerModal from "@/components/solo/TrickWinnerModal";
import RoundWinnerModal from "@/components/solo/RoundWinnerModal";

export default function GamePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { gameId } = useParams();
    const snapshot = useSelector(
        (state: RootState) => state.game.snapshot
    );
    const winner = useSelector(
        (state: RootState) => state.game.winner
    );
    const winnerPlayerId = useSelector(
        (state: RootState) => state.game.winnerPlayerId
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
    const dealing = useSelector(
        (state: RootState) => state.game.dealing
    );
    const loadError = useSelector(
        (state: RootState) => state.game.loadError
    );
    const playError = useSelector(
        (state: RootState) => state.game.playError
    );
    const playingRef = useRef(false);
    const cancelledRef = useRef(false);

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const waitNextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    const dealingRef = useRef(dealing);

    useEffect(() => {
        dealingRef.current = dealing;
    }, [dealing]);

    const waitForDealingComplete = async () => {
        while (dealingRef.current) {
            await wait(1600);
        }
    };

    const load = useCallback(async () => {
        if (!gameId) {
            return;
        }
        try {
            const view = await getView(gameId);
            if (cancelledRef.current) {
                return;
            }
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
        } catch (error) {
            if (!cancelledRef.current) {
                console.error(error);
                dispatch(setLoadError(true));
            }
        }
    }, [gameId, dispatch]);

    useEffect(() => {
        dispatch(resetGameState());
        dispatch(setLoadError(false));
        dispatch(setPlayError(null));
        cancelledRef.current = false;
        load();
        return () => {
            cancelledRef.current = true;
        };
    }, [gameId, load, dispatch]);

    const handlePlay = async (cardId: string) => {
        if (!gameId) {
            return;
        }
        if (playingRef.current) {
            return;
        }
        playingRef.current = true;
        dispatch(setPlayError(null));
        dispatch(
            setAnimating(true)
        );
        try {
            const result = await playTurn(gameId, HUMAN_PLAYER_ID, cardId);
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
                            (p: any) => p.id === HUMAN_PLAYER_ID && event.playerId === HUMAN_PLAYER_ID
                                ? { ...p, hand: p.hand?.filter((c: any) => c.id !== event.cardId) }
                                : p
                        )
                    };
                    dispatch(
                        setSnapshot(latestSnapshot)
                    );
                    await wait(700);
                }
                if (event.type === "TRUMP_DECLARED") {
                    const suit = event.suit ?? result.snapshot.trumpSuit;
                    latestSnapshot = {
                        ...latestSnapshot,
                        trumpSuit: suit,
                    };
                    dispatch(setTrumpDeclaration(suit));
                    dispatch(setSnapshot(latestSnapshot));
                    await wait(2000);
                    dispatch(setTrumpDeclaration(null));
                }
                if (event.type === "TRICK_COMPLETED") {
                    const finalPlayers = result.snapshot?.players;
                    if (finalPlayers) {
                        latestSnapshot = {
                            ...latestSnapshot,
                            players: latestSnapshot.players.map(
                                (p: any) => {
                                    const finalP = finalPlayers.find(
                                        (fp: any) => fp.id === p.id
                                    );
                                    return finalP
                                        ? {
                                              ...p,
                                              tricksWonRound: finalP.tricksWonRound,
                                              totalTricks: finalP.totalTricks,
                                          }
                                        : p;
                                }
                            ),
                        };
                        dispatch(setSnapshot(latestSnapshot));
                    }
                    if (event.trickWinner?.id) {
                        dispatch(setTrickCollect(event.trickWinner.id));
                        await wait(700);
                    }
                    dispatch(setTrickCards([]));
                    cards = [];
                    dispatch(setTrickCollect(null));
                    await waitNextFrame();
                    dispatch(setTrickWinner(event.trickWinner));
                    await wait(1000);
                    dispatch(setTrickWinner(null));
                }
                if (event.type === "ROUND_COMPLETED") {
                    latestSnapshot = result.snapshot;
                    dispatch(setSnapshot(result.snapshot));
                    if (event.trickWinner?.id) {
                        dispatch(setTrickCollect(event.trickWinner.id));
                        await wait(700);
                    }
                    dispatch(setTrickCards([]));
                    cards = [];
                    dispatch(setTrickCollect(null));
                    dispatch(setDealing(true));
                    dispatch(setTrickWinner(event.trickWinner));
                    await wait(1000);
                    dispatch(setTrickWinner(null));
                    dispatch(setRoundWinner(event.roundWinner));
                    await wait(2000);
                    dispatch(setRoundWinner(null));
                    await waitNextFrame();
                    await wait(1600);
                    dispatch(setDealing(false));
                }
                if (event.type === "MATCH_COMPLETED") {
                    if (event.trickWinner?.id) {
                        dispatch(setTrickCollect(event.trickWinner.id));
                        await wait(700);
                    }
                    dispatch(setTrickCards([]));
                    cards = [];
                    dispatch(setTrickCollect(null));
                    if (event.winner) {
                        dispatch(setWinnerPlayerId(event.winner));
                    }
                    dispatch(setTrickWinner(event.trickWinner));
                    await wait(1000);
                    dispatch(setTrickWinner(null));
                    dispatch(setRoundWinner(event.roundWinner));
                    await wait(2000);
                    dispatch(setRoundWinner(null));
                    await wait(1000);
                }
            }

            dispatch(setSnapshot(result.snapshot));

            if (!result.snapshot.completed && result.snapshot.currentPlayerId === HUMAN_PLAYER_ID) {
                try {
                    const legalCards = await getLegalMoves(gameId, HUMAN_PLAYER_ID);
                    dispatch(setSnapshot({
                        ...result.snapshot,
                        legalMoves: legalCards.map((c) => c.id),
                    }));
                } catch (error) {
                    console.error(error);
                }
            }

            if (result.snapshot.completed) {
                dispatch(setWinner(result.snapshot));
            }
        } catch (error) {
            console.error(error);
            dispatch(setPlayError(extractErrorMessage(error, "Failed to play card")));
        } finally {
            playingRef.current = false;
            dispatch(
                setAnimating(false)
            );
        }
    };

    if (!snapshot) {
        if (loadError) {
            return (
                <div className="
                    min-h-screen
                    bg-slate-950
                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-6
                    text-white
                    px-4
                ">
                    <div className="text-2xl font-semibold">
                        Failed to load game
                    </div>
                    <div className="text-white/60 text-center max-w-sm">
                        Could not reach the server. Check that the backend is running.
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                dispatch(setLoadError(false));
                                load();
                            }}
                            className="
                                px-6
                                py-3
                                rounded-xl
                                bg-green-600
                                hover:bg-green-500
                                font-semibold
                                cursor-pointer
                            "
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="
                                px-6
                                py-3
                                rounded-xl
                                bg-white/10
                                hover:bg-white/20
                                font-semibold
                                cursor-pointer
                            "
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            );
        }
        return <GameLoader />;
    }

    return (
        <>
            {playError && (
                <div className="
                    fixed
                    top-4
                    left-1/2
                    -translate-x-1/2
                    z-300
                    flex
                    items-center
                    gap-4
                    bg-red-600/90
                    text-white
                    px-5
                    py-3
                    rounded-xl
                    shadow-lg
                ">
                    <span>{playError}</span>
                    <button
                        onClick={() => dispatch(setPlayError(null))}
                        className="cursor-pointer font-bold"
                    >
                        ✕
                    </button>
                </div>
            )}

            <GameBoard onPlay={handlePlay} />

            <TrumpDeclarationModal suit={trumpDeclaration} />

            <TrickWinnerModal trickWinner={trickWinner} />

            <RoundWinnerModal roundWinner={roundWinner} />

            <WinnerModal winner={winner} winnerPlayerId={winnerPlayerId} gameId={snapshot.gameId} />
        </>
    )
}
