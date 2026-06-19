import { removeGame } from "@/api/gameApi";
import { setSnapshot, setTrickCards, setAnimating, setDealing, setWinnerTeam } from "@/store/slices/gameSlice";
import {
    Trophy,
    Home,
    X,
    Crown,
    User,
    Bot,
    Star,
} from "lucide-react";
import { useDispatch } from "react-redux";

import {
    useNavigate
} from "react-router-dom";

interface Props {
    winnerTeam: any;
    gameId: any;
}

export default function WinnerTeamModal({
    winnerTeam,
    gameId,
}: Props) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    if (!winnerTeam) {
        return null;
    }
    const teamMembers = winnerTeam.players.reduce(
        (acc: any, player: any) => {
            if (!acc[player.teamId]) {
                acc[player.teamId] = [];
            }

            acc[player.teamId].push(player);

            return acc;
        },
        {}
    );

    const winningTeamData = winnerTeam.teams.reduce(
        (best: any, current: any) =>
            current.roundsWon > best.roundsWon || (current.roundsWon === best.roundsWon && current.totalTricks > best.totalTricks)
                ? current
                : best
    );

    const winningTeamId = winningTeamData?.id;

    const winnerMembers = teamMembers[winningTeamId] || [];

    const mvp = [...winnerTeam.players].sort(
        (a, b) => b.totalTricks - a.totalTricks
    )[0];

    const closeModal = async () => {
        await removeGame(gameId);
        dispatch(setSnapshot(null));
        dispatch(setWinnerTeam(null));
        dispatch(setTrickCards([]));
        dispatch(setAnimating(false));
        dispatch(setDealing(false));
        navigate("/");
    };

    return (
        <div className="
            fixed
            inset-0
            z-100
            bg-black/80
            backdrop-blur-md
            flex
            items-center
            justify-center
            p-4
        ">
            <div className="
                relative
                w-full
                max-w-lg
                max-h-[95vh]
                overflow-hidden
                rounded-3xl
                border
                border-white/10
                bg-linear-to-b
                from-slate-900
                to-slate-950
                shadow-2xl
                flex
                flex-col
            ">

                {/* Close */}

                <button
                    onClick={closeModal}
                    className="
                        absolute
                        top-4
                        right-4
                        z-20
                        w-10
                        h-10
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
                        pb-8
                        text-center
                        border-b
                        border-white/10
                    ">
                        <div className="
                            mx-auto
                            w-32
                            h-32
                            rounded-full
                            bg-yellow-400
                            flex
                            items-center
                            justify-center
                            shadow-[0_0_80px_rgba(250,204,21,.45)]
                        ">
                            <Trophy
                                size={64}
                                className="text-yellow-300"
                            />
                        </div>
                        <div className="
                            mt-5
                            text-yellow-300
                            uppercase
                            tracking-[0.4em]
                            text-xs
                            font-bold
                        ">
                            Match Champion
                        </div>
                        <h1
                            className="
                                mt-4
                                text-5xl
                                font-black
                                text-white
                            "
                        >
                            TEAM{" "}
                            {winningTeamData?.name}
                        </h1>

                        <div
                            className="
                                mt-3
                                text-slate-400
                                text-lg
                            "
                        >
                            {winnerMembers
                                .map((member: any) =>
                                    member.id === "P1"
                                        ? "You"
                                        : member.name
                                )
                                .join(" + ")}
                        </div>

                        {/* Team Avatars */}

                        <div
                            className="
                                flex
                                justify-center
                                -space-x-5
                                mt-6
                            "
                        >
                            {winnerMembers.map(
                                (member: any) => (
                                    <div
                                        key={member.id}
                                        className="
                                            w-18
                                            h-18
                                            rounded-full
                                            border-4
                                            border-slate-900
                                            bg-yellow-500/20
                                            flex
                                            items-center
                                            justify-center
                                        "
                                    >
                                        {member.id ===
                                            "P1" ? (
                                            <User
                                                size={
                                                    28
                                                }
                                                className="text-white"
                                            />
                                        ) : (
                                            <Bot
                                                size={
                                                    28
                                                }
                                                className="text-white"
                                            />
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {/* Team Battle */}

                    <div
                        className="
                            p-6
                            grid
                            md:grid-cols-2
                            gap-5
                        "
                    >
                        {winnerTeam.teams.map(
                            (team: any) => {
                                const members =
                                    teamMembers[
                                    team.id
                                    ] || [];

                                const isWinner =
                                    team.id ===
                                    winningTeamId;

                                return (
                                    <div
                                        key={
                                            team.id
                                        }
                                        className={`
                                            relative
                                            rounded-3xl
                                            border
                                            p-5
                                            transition-all

                                            ${isWinner
                                                ? `
                                                        border-yellow-400
                                                        bg-yellow-500/10
                                                        shadow-[0_0_40px_rgba(250,204,21,.25)]
                                                        scale-[1.02]
                                                      `
                                                : `
                                                        border-white/10
                                                        bg-white/5
                                                      `
                                            }
                                        `}
                                    >
                                        {isWinner && (
                                            <div
                                                className="
                                                    absolute
                                                    -top-5
                                                    left-1/2
                                                    -translate-x-1/2
                                                "
                                            >
                                                <Crown
                                                    size={
                                                        34
                                                    }
                                                    className="
                                                        text-yellow-400
                                                    "
                                                />
                                            </div>
                                        )}

                                        <div
                                            className="
                                                text-center
                                            "
                                        >
                                            <div
                                                className="
                                                    text-2xl
                                                    font-black
                                                    text-white
                                                "
                                            >
                                                TEAM{" "}
                                                {
                                                    team.name
                                                }
                                            </div>

                                            <div
                                                className="
                                                    mt-2
                                                    text-sm
                                                    text-slate-400
                                                "
                                            >
                                                {members
                                                    .map(
                                                        (
                                                            member: any
                                                        ) =>
                                                            member.id ===
                                                                "P1"
                                                                ? "You"
                                                                : member.name
                                                    )
                                                    .join(
                                                        " + "
                                                    )}
                                            </div>
                                        </div>

                                        <div
                                            className="
                                                grid
                                                grid-cols-2
                                                gap-4
                                                mt-6
                                            "
                                        >
                                            <div>
                                                <div
                                                    className="
                                                        text-xs
                                                        text-slate-500
                                                        uppercase
                                                    "
                                                >
                                                    Total
                                                    Tricks
                                                </div>

                                                <div
                                                    className="
                                                        text-4xl
                                                        font-black
                                                        text-white
                                                    "
                                                >
                                                    {
                                                        team.totalTricks
                                                    }
                                                </div>
                                            </div>

                                            <div>
                                                <div
                                                    className="
                                                        text-xs
                                                        text-slate-500
                                                        uppercase
                                                    "
                                                >
                                                    Rounds
                                                    Won
                                                </div>

                                                <div
                                                    className="
                                                        text-4xl
                                                        font-black
                                                        text-yellow-300
                                                    "
                                                >
                                                    {
                                                        team.roundsWon
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>

                    {/* MVP */}

                    <div className="px-6 pb-6">
                        <div
                            className="
                                rounded-3xl
                                border
                                border-green-400/20
                                bg-green-500/10
                                p-5
                                text-center
                            "
                        >
                            <div
                                className="
                                    flex
                                    items-center
                                    justify-center
                                    gap-2
                                    text-green-300
                                    font-bold
                                    uppercase
                                    tracking-widest
                                    text-xs
                                "
                            >
                                <Star size={14} />
                                MVP
                            </div>

                            <div
                                className="
                                    mt-3
                                    text-2xl
                                    font-black
                                    text-white
                                "
                            >
                                {mvp.id === "P1"
                                    ? "You"
                                    : mvp.name}
                            </div>

                            <div
                                className="
                                    text-green-300
                                    text-lg
                                    font-bold
                                "
                            >
                                {mvp.totalTricks} Tricks
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}

                <div
                    className="
                        border-t
                        border-white/10
                        p-4
                    "
                >
                    <button
                        onClick={closeModal}
                        className="
                            w-full
                            h-14
                            rounded-2xl
                            bg-green-500
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
                        Return To Lobby
                    </button>
                </div>
            </div>
        </div>
    );
}