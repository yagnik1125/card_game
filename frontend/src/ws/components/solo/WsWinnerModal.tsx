import { emitWithAck } from "@/ws/client/socketClient";
import { resetWsGame } from "@/store/slices/wsGameSlice";
import { selectSoloMatchWinner } from "@/utils/winner";
import { HUMAN_PLAYER_ID } from "@/utils/constants";
import { useWinnerConfetti } from "@/hooks/useWinnerConfetti";
import type { GameView, ViewPlayer } from "@/ws/dto/gameView";
import {
    Trophy,
    Home,
    X,
    Crown,
    Medal,
    Sparkles,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { useModalA11y } from "@/ws/hooks/useModalA11y";

import {
    useNavigate
} from "react-router-dom";

interface Props {
    winner: GameView | null;
    winnerPlayerId?: string | null;
    gameId?: string | null;
    onQuit?: () => void;
}

export default function WsWinnerModal({
    winner,
    winnerPlayerId,
    gameId,
    onQuit,
}: Props) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isHumanWinner = !!winner && winnerPlayerId === HUMAN_PLAYER_ID;

    useWinnerConfetti(!!winner, isHumanWinner);

    const closeModal = () => {
        dispatch(resetWsGame());
        // Fire-and-forget: never blocks navigation (BUG-FE-14). The backend
        // also cleans the game up when the last socket leaves/disconnects.
        if (gameId) {
            emitWithAck("GAME:REMOVE", { gameId }).catch((error) =>
                console.error(error)
            );
        }
        if (onQuit) {
            onQuit();
        } else {
            navigate("/ws");
        }
    };

    const a11y = useModalA11y(!!winner, closeModal);

    if (!winner) {
        return null;
    }

    const matchWinner =
        winner.players.find((p) => p.id === winnerPlayerId)
        ?? selectSoloMatchWinner(winner.players);

    if (!matchWinner) {
        return null;
    }

    const podium = [...winner.players].sort(
        (a: ViewPlayer, b: ViewPlayer) =>
            (b.roundsWon - a.roundsWon) || (b.totalTricks - a.totalTricks)
    );

    const gold = podium[0];
    const silver = podium[1];
    const bronze = podium[2];
    const others = podium.slice(3);

    const playerName = (player: ViewPlayer) =>
        player.id === HUMAN_PLAYER_ID ? "You" : player.name;

    return (
        <div
            {...a11y}
            className="
            fixed
            inset-0
            z-100
            bg-black/80
            backdrop-blur-md
            flex
            items-center
            justify-center
            p-3
        ">
            {/* Ambient glow */}
            <div className="
                absolute
                left-1/2
                top-1/2
                w-[640px]
                h-[640px]
                rounded-full
                bg-yellow-500/10
                blur-3xl
                animate-glow-breath
                pointer-events-none
            " />

            {/* Animated gradient border shell */}
            <div className="
                relative
                w-full
                max-w-lg
                max-h-[92vh]
                rounded-3xl
                p-[2px]
                overflow-hidden
            ">
                <div className="
                    absolute
                    -inset-[150%]
                    animate-spin-slow
                    bg-[conic-gradient(from_0deg,#f59e0b_0%,#fbbf24_18%,transparent_45%,transparent_55%,#f59e0b_82%,#fbbf24_100%)]
                " />
                <div className="
                    relative
                    rounded-[22px]
                    bg-slate-950
                    flex
                    flex-col
                    max-h-[92vh]
                    overflow-hidden
                ">

                    {/* Close */}
                    <button
                        onClick={closeModal}
                        className="
                            absolute
                            top-3
                            right-3
                            z-20
                            w-9
                            h-9
                            rounded-full
                            bg-white/10
                            hover:bg-white/20
                            flex
                            items-center
                            justify-center
                            text-white
                            cursor-pointer
                        "
                    >
                        <X size={18} />
                    </button>

                    {/* Scroll Area */}
                    <div className="
                        overflow-y-auto
                        flex-1
                        scrollbar-hide
                    ">

                        {/* Hero */}
                        <div className="
                            px-6
                            pt-8
                            pb-6
                            text-center
                        ">
                            <div className="
                                relative
                                mx-auto
                                mb-5
                                w-24
                                h-24
                                rounded-full
                                bg-gradient-to-b
                                from-yellow-300
                                to-amber-500
                                animate-trophy-pulse
                                overflow-hidden
                                flex
                                items-center
                                justify-center
                                shadow-[0_8px_30px_rgba(251,191,36,0.35)]
                            ">
                                <div className="absolute inset-0 overflow-hidden rounded-full">
                                    <div className="
                                        absolute
                                        top-0
                                        bottom-0
                                        w-1/3
                                        bg-white/40
                                        blur-sm
                                        animate-shine-sweep
                                    " />
                                </div>
                                <Trophy
                                    size={44}
                                    className="text-black"
                                />
                            </div>

                            <div className="
                                text-amber-400
                                font-bold
                                uppercase
                                tracking-[0.3em]
                                text-xs
                            ">
                                Match Complete
                            </div>

                            <h1 className="
                                mt-2
                                text-4xl
                                font-black
                                bg-gradient-to-r
                                from-yellow-200
                                via-amber-400
                                to-yellow-500
                                bg-clip-text
                                text-transparent
                                animate-winner-pop
                            ">
                                {matchWinner.id === HUMAN_PLAYER_ID
                                    ? "You Won!"
                                    : `${matchWinner.name} Wins`
                                }
                            </h1>

                            <div className="
                                mt-2
                                inline-flex
                                items-center
                                gap-2
                                text-white/70
                                text-sm
                            ">
                                <Sparkles size={14} className="text-amber-400" />
                                Match Champion
                                <Crown size={14} className="text-amber-400" />
                            </div>
                        </div>

                        {/* Champion stats */}
                        <div className="
                            grid
                            grid-cols-3
                            gap-2
                            px-4
                            pb-5
                        ">
                            <div className="
                                rounded-2xl
                                bg-white/5
                                border
                                border-white/10
                                px-3
                                py-3
                                text-center
                            ">
                                <div className="text-2xl font-black text-amber-400">
                                    {matchWinner.totalTricks}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">
                                    Tricks Won
                                </div>
                            </div>
                            <div className="
                                rounded-2xl
                                bg-white/5
                                border
                                border-white/10
                                px-3
                                py-3
                                text-center
                            ">
                                <div className="text-2xl font-black text-amber-400">
                                    {matchWinner.roundsWon ?? 0}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">
                                    Rounds Won
                                </div>
                            </div>
                            <div className="
                                rounded-2xl
                                bg-white/5
                                border
                                border-white/10
                                px-3
                                py-3
                                text-center
                            ">
                                <div className="text-2xl font-black text-amber-400">
                                    #1
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">
                                    Rank
                                </div>
                            </div>
                        </div>

                        {/* Podium */}
                        <div className="
                            grid
                            grid-cols-3
                            gap-2
                            items-end
                            px-4
                            pb-2
                        ">
                            {silver && (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-xs font-bold text-white/80 truncate max-w-full">
                                        {playerName(silver)}
                                    </div>
                                    <div className="
                                        w-14
                                        h-14
                                        rounded-full
                                        bg-slate-600/80
                                        flex
                                        items-center
                                        justify-center
                                        animate-medal-bounce
                                        shadow-lg
                                    ">
                                        <Medal size={24} className="text-slate-300" />
                                    </div>
                                    <div className="
                                        w-full
                                        h-10
                                        rounded-t-xl
                                        bg-slate-700/70
                                        flex
                                        items-start
                                        justify-center
                                        pt-1.5
                                        text-xs
                                        font-black
                                        text-white/70
                                    ">
                                        2nd
                                    </div>
                                </div>
                            )}

                            {gold && (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-xs font-black text-amber-300 truncate max-w-full">
                                        {playerName(gold)}
                                    </div>
                                    <div className="
                                        w-16
                                        h-16
                                        rounded-full
                                        bg-gradient-to-b
                                        from-yellow-300
                                        to-amber-500
                                        flex
                                        items-center
                                        justify-center
                                        animate-medal-bounce
                                        shadow-[0_6px_24px_rgba(251,191,36,0.4)]
                                    ">
                                        <Crown size={28} className="text-black" />
                                    </div>
                                    <div className="
                                        w-full
                                        h-12
                                        rounded-t-xl
                                        bg-gradient-to-b
                                        from-yellow-500
                                        to-amber-600
                                        flex
                                        items-start
                                        justify-center
                                        pt-1.5
                                        text-xs
                                        font-black
                                        text-black
                                    ">
                                        1st
                                    </div>
                                </div>
                            )}

                            {bronze && (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="text-xs font-bold text-white/80 truncate max-w-full">
                                        {playerName(bronze)}
                                    </div>
                                    <div className="
                                        w-14
                                        h-14
                                        rounded-full
                                        bg-amber-800/80
                                        flex
                                        items-center
                                        justify-center
                                        animate-medal-bounce
                                        shadow-lg
                                    ">
                                        <Medal size={24} className="text-amber-300" />
                                    </div>
                                    <div className="
                                        w-full
                                        h-9
                                        rounded-t-xl
                                        bg-amber-900/70
                                        flex
                                        items-start
                                        justify-center
                                        pt-1.5
                                        text-xs
                                        font-black
                                        text-white/70
                                    ">
                                        3rd
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Remaining players */}
                        {others.length > 0 && (
                            <div className="px-4 pt-3 pb-4 space-y-1">
                                {others.map((player, index) => (
                                    <div
                                        key={player.id}
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            rounded-xl
                                            bg-white/5
                                            border
                                            border-white/10
                                            px-3
                                            py-2
                                        "
                                    >
                                        <div className="flex items-center gap-2 text-white/80 text-sm font-bold">
                                            <span className="text-white/40 text-xs">
                                                #{index + 4}
                                            </span>
                                            {playerName(player)}
                                        </div>
                                        <div className="text-sm font-black text-white">
                                            {player.totalTricks}
                                            <span className="text-white/40 text-xs font-normal ml-1">
                                                tricks
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="
                        border-t
                        border-white/10
                        p-4
                    ">
                        <button
                            onClick={closeModal}
                            className="
                                w-full
                                h-13
                                rounded-2xl
                                bg-gradient-to-r
                                from-green-500
                                to-emerald-500
                                text-black
                                font-black
                                flex
                                items-center
                                justify-center
                                gap-3
                                cursor-pointer
                                hover:scale-[1.01]
                                active:scale-[.98]
                                transition-all
                            "
                        >
                            <Home size={20} />
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
