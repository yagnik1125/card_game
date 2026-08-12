import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import { emitWithAck } from "@/ws/client/socketClient";
import { useWsGame } from "@/ws/hooks/useWsGame";
import { useWsAnimator } from "@/ws/hooks/useWsAnimator";
import { applyServerEvent, clearError } from "@/store/slices/wsGameSlice";
import {
    selectConnection,
    selectError,
    selectRoundWinner,
    selectSnapshot,
    selectTrumpDeclaration,
    selectTrickWinner,
    selectWatching,
    selectWinnerPlayerId,
} from "@/ws/store/selectors";
import type { ServerEnvelope } from "@/ws/protocol/serverEvents";
import { HUMAN_PLAYER_ID } from "@/utils/constants";

import GameLoader from "@/components/common/GameLoader";
import WsGameBoard from "@/ws/components/solo/WsGameBoard";
import WsTrickWinnerModal from "@/ws/components/solo/WsTrickWinnerModal";
import WsRoundWinnerModal from "@/ws/components/solo/WsRoundWinnerModal";
import WsWinnerModal from "@/ws/components/solo/WsWinnerModal";
import WsTrumpDeclarationModal from "@/ws/components/common/WsTrumpDeclarationModal";

export default function WsGamePage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { gameId } = useParams();

    const snapshot = useSelector(selectSnapshot);
    const connection = useSelector(selectConnection);
    const trickWinner = useSelector(selectTrickWinner);
    const roundWinner = useSelector(selectRoundWinner);
    const trumpDeclaration = useSelector(selectTrumpDeclaration);
    const winnerPlayerId = useSelector(selectWinnerPlayerId);
    const error = useSelector(selectError);
    const watching = useSelector(selectWatching);

    const handleGameRemoved = useCallback(() => {
        navigate("/ws");
    }, [navigate]);

    const { reconnecting, resynced } = useWsGame({
        gameId: gameId ?? "",
        playerId: HUMAN_PLAYER_ID,
        onGameRemoved: handleGameRemoved,
    });
    useWsAnimator();

    const handlePlay = useCallback(
        (cardId: string) => {
            if (!gameId) {
                return;
            }
            emitWithAck("GAME:PLAY_CARD", {
                gameId,
                playerId: HUMAN_PLAYER_ID,
                cardId,
            }).then((ack) => {
                if (!ack.ok) {
                    const failure = ack.error ?? {
                        code: "UNKNOWN",
                        message: "Play failed",
                    };
                    dispatch(
                        applyServerEvent({
                            type: "GAME_ERROR",
                            payload: {
                                code: failure.code,
                                message: failure.message,
                            },
                            timestamp: Date.now(),
                        } as ServerEnvelope)
                    );
                }
            });
        },
        [gameId, dispatch]
    );

    const handleQuit = useCallback(() => {
        navigate("/ws");
    }, [navigate]);

    if (!snapshot) {
        return <GameLoader />;
    }

    return (
        <div className="relative">
            <WsGameBoard
                onPlay={handlePlay}
                onQuit={handleQuit}
                handDisabled={reconnecting}
            />
            <WsTrickWinnerModal trickWinner={trickWinner} />
            <WsRoundWinnerModal roundWinner={roundWinner} />
            <WsTrumpDeclarationModal suit={trumpDeclaration} />
            <WsWinnerModal
                winner={snapshot.completed ? snapshot : null}
                winnerPlayerId={winnerPlayerId}
                gameId={gameId}
                onQuit={handleQuit}
            />

            {watching && (
                <div className="fixed top-4 right-4 z-200 px-4 py-2 rounded-full bg-sky-600/90 text-white text-sm font-semibold shadow-lg">
                    Another player is watching
                </div>
            )}

            {(connection === "reconnecting" || connection === "error") && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-200 px-5 py-2.5 rounded-full bg-amber-500/90 text-black font-semibold shadow-lg">
                    {connection === "reconnecting"
                        ? "Reconnecting to the game server…"
                        : "Connection lost — retrying…"}
                </div>
            )}

            {resynced && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-200 px-5 py-2.5 rounded-full bg-emerald-600/95 text-white font-semibold shadow-lg">
                    Reconnected — resynced
                </div>
            )}

            {error && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-200 flex items-center gap-3 px-5 py-2.5 rounded-full bg-rose-600/95 text-white font-semibold shadow-lg">
                    <span>{error.message}</span>
                    <button
                        onClick={() => dispatch(clearError())}
                        className="underline cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}
        </div>
    );
}
