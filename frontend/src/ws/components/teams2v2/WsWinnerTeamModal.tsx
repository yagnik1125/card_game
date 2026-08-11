import { emitWithAck } from "@/ws/client/socketClient";
import { resetWsGame } from "@/store/slices/wsGameSlice";
import { HUMAN_PLAYER_ID } from "@/utils/constants";
import { useWinnerConfetti } from "@/hooks/useWinnerConfetti";
import type { GameView, ViewPlayer, ViewTeam } from "@/ws/dto/gameView";
import {
    Trophy,
    Home,
    X,
    Crown,
    User,
    Bot,
    Star,
    Medal,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { useModalA11y } from "@/ws/hooks/useModalA11y";

import {
    useNavigate
} from "react-router-dom";

interface Props {
    winner: GameView | null;
    winnerTeamId?: string | null;
    gameId?: string | null;
    onQuit?: () => void;
}

export default function WsWinnerTeamModal({
    winner,
    winnerTeamId,
    gameId,
    onQuit,
}: Props) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const winningTeamData =
        winner && winnerTeamId
            ? winner.teams.find((t) => t.id === winnerTeamId) ?? null
            : null;
    const winningTeamId = winningTeamData?.id ?? null;
    const isHumanWinner =
        !!winner &&
        !!winningTeamId &&
        winner.players.some(
            (p) => p.id === HUMAN_PLAYER_ID && p.teamId === winningTeamId
        );

    useWinnerConfetti(!!winner, isHumanWinner);

    const closeModal = () => {
        dispatch(resetWsGame());
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

    const a11y = useModalA11y(!!winner && !!winningTeamData, closeModal);

    if (!winner || !winningTeamData) {
        return null;
    }

    const teamMembers = winner.players.reduce(
        (acc: Record<string, ViewPlayer[]>, player: ViewPlayer) => {
            const teamKey = player.teamId ?? "";

            if (!acc[teamKey]) {
                acc[teamKey] = [];
            }

            acc[teamKey].push(player);

            return acc;
        },
        {} as Record<string, ViewPlayer[]>
    );

    const winnerMembers = teamMembers[winningTeamId ?? ""] || [];

    const mvp = [...winner.players].sort(
        (a, b) => b.totalTricks - a.totalTricks
    )[0];

    const standings = [...winner.teams].sort(
        (a: ViewTeam, b: ViewTeam) =>
            (b.roundsWon - a.roundsWon) || (b.totalTricks - a.totalTricks)
    );

    const memberName = (player: ViewPlayer) =>
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
                                TEAM{" "}
                                {winningTeamData.name}
                            </h1>

                            <div className="
                                mt-2
                                inline-flex
                                items-center
                                gap-2
                                text-white/70
                                text-sm
                            ">
                                <Star size={14} className="text-amber-400" />
                                Champion Team
                                <Crown size={14} className="text-amber-400" />
                            </div>

                            {/* Winning team members */}
                            <div className="
                                mt-4
                                flex
                                items-center
                                justify-center
                                gap-2
                            ">
                                {winnerMembers.map((player: ViewPlayer) => (
                                    <div
                                        key={player.id}
                                        className="
                                            flex
                                            items-center
                                            gap-2
                                            rounded-full
                                            bg-white/5
                                            border
                                            border-amber-400/30
                                            px-3
                                            py-1.5
                                        "
                                    >
                                        {player.id === HUMAN_PLAYER_ID
                                            ? <User size={14} className="text-amber-300" />
                                            : <Bot size={14} className="text-amber-300" />
                                        }
                                        <span className="text-sm font-bold text-white/90">
                                            {memberName(player)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Team stats */}
                        <div className="
                            grid
                            grid-cols-2
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
                                    {winningTeamData.totalTricks}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">
                                    Team Tricks Won
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
                                    {winningTeamData.roundsWon}
                                </div>
                                <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">
                                    Rounds Won
                                </div>
                            </div>
                        </div>

                        {/* MVP */}
                        {mvp && (
                            <div className="px-4 pb-3">
                                <div className="
                                    rounded-2xl
                                    bg-gradient-to-r
                                    from-amber-500/15
                                    to-yellow-500/5
                                    border
                                    border-amber-400/30
                                    px-4
                                    py-3
                                    flex
                                    items-center
                                    justify-between
                                ">
                                    <div className="flex items-center gap-3">
                                        <div className="
                                            w-10
                                            h-10
                                            rounded-full
                                            bg-gradient-to-b
                                            from-yellow-300
                                            to-amber-500
                                            flex
                                            items-center
                                            justify-center
                                        ">
                                            <Star size={18} className="text-black" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase tracking-widest text-amber-300/80">
                                                Match MVP
                                            </div>
                                            <div className="text-white font-black">
                                                {memberName(mvp)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-white">
                                            {mvp.totalTricks}
                                        </div>
                                        <div className="text-[10px] uppercase tracking-widest text-white/50">
                                            tricks
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Team standings */}
                        <div className="px-4 pb-5 space-y-1.5">
                            {standings.map((team: ViewTeam, index: number) => (
                                <div
                                    key={team.id}
                                    className={`
                                        flex
                                        items-center
                                        justify-between
                                        rounded-xl
                                        px-3
                                        py-2.5
                                        border
                                        ${team.id === winningTeamId
                                            ? "bg-amber-500/10 border-amber-400/40"
                                            : "bg-white/5 border-white/10"
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-7
                                            h-7
                                            rounded-full
                                            flex
                                            items-center
                                            justify-center
                                            ${index === 0
                                                ? "bg-gradient-to-b from-yellow-300 to-amber-500"
                                                : index === 1
                                                    ? "bg-slate-500/80"
                                                    : "bg-slate-700/80"
                                            }
                                        `}>
                                            {index === 0
                                                ? <Crown size={14} className="text-black" />
                                                : <Medal size={14} className="text-white" />
                                            }
                                        </div>
                                        <div className="text-sm font-black text-white">
                                            {team.name}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="text-white/60">
                                            <span className="font-black text-white">
                                                {team.totalTricks}
                                            </span>
                                            {" tricks"}
                                        </div>
                                        <div className="text-white/60">
                                            <span className="font-black text-white">
                                                {team.roundsWon}
                                            </span>
                                            {" rounds"}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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
