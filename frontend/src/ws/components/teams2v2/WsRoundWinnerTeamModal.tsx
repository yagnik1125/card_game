import { useSelector, useDispatch } from "react-redux";
import {
    Crown,
    Bot,
    User,
} from "lucide-react";
import { HUMAN_PLAYER_ID } from "@/utils/constants";
import { setRoundWinnerTeam } from "@/store/slices/wsGameSlice";
import { selectSnapshot } from "@/ws/store/selectors";
import { useModalA11y } from "@/ws/hooks/useModalA11y";
import type {
    RoundWinnerTeam,
    TrickWinnerTeam,
} from "@/ws/dto/winners";
import type { ViewPlayer } from "@/ws/dto/gameView";

interface Props {
    roundWinnerTeam: RoundWinnerTeam | null;
}

export default function WsRoundWinnerTeamModal({
    roundWinnerTeam,
}: Props) {
    const snapshot = useSelector(selectSnapshot);
    const dispatch = useDispatch();
    const a11y = useModalA11y(
        !!roundWinnerTeam && !!snapshot,
        () => dispatch(setRoundWinnerTeam(null))
    );
    if (!roundWinnerTeam || !snapshot) return null;

    const formatTeamName = (name: string) => name.startsWith("Team ") ? name : `Team ${name}`;
    const winnerName = formatTeamName(roundWinnerTeam.name);

    const teamMembers = snapshot.players.reduce(
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

    return (
        <div
            {...a11y}
            className="
                fixed
                inset-0
                z-120
                flex
                items-center
                justify-center
                pointer-events-none
            "
        >
            <div
                className="
                    absolute
                    inset-0
                    bg-black/50
                    backdrop-blur-sm
                "
            />

            {/* Glow */}

            <div
                className="
                    absolute
                    w-96
                    h-96
                    rounded-full
                    border
                    border-yellow-400/20
                    animate-ping
                "
            />

            {/* Modal */}

            <div
                className="
                    relative
                    w-[min(92vw,600px)]
                    rounded-4xl
                    border
                    border-yellow-400/20
                    bg-black/80
                    backdrop-blur-xl
                    px-8
                    py-8
                    shadow-[0_0_80px_rgba(250,204,21,.25)]
                    animate-in
                    zoom-in
                    fade-in
                    duration-300
                "
            >
                {/* Header */}

                <div className="text-center mb-8">

                    <div
                        className="
                            uppercase
                            tracking-[0.4em]
                            text-yellow-300
                            text-xs
                            font-bold
                        "
                    >
                        Round Winner
                    </div>

                    <div
                        className="
                            mt-3
                            text-5xl
                            font-black
                            text-white
                        "
                    >
                        {winnerName}
                    </div>
                </div>

                {/* Players */}

                <div
                    className="
                        grid
                        grid-cols-2
                        gap-4
                    "
                >
                    {roundWinnerTeam.teams.map((team: TrickWinnerTeam) => {
                        const isWinner =
                            team.id === roundWinnerTeam.id;

                        const members =
                            teamMembers[team.id] ?? [];

                        return (
                            <div
                                key={team.id}
                                className={`
                                    relative
                                    rounded-3xl
                                    border
                                    p-6
                                    flex
                                    flex-col
                                    items-center
                                    transition-all

                                    ${isWinner
                                        ? `
                                            border-yellow-400
                                            bg-yellow-500/10
                                            shadow-[0_0_40px_rgba(250,204,21,.25)]
                                        `
                                        : `
                                            border-white/10
                                            bg-white/5
                                        `
                                    }
                                `}
                            >
                                {/* Crown */}
                                {isWinner && (
                                    <div
                                        className="
                                            absolute
                                            -top-4
                                            left-1/2
                                            -translate-x-1/2
                                        "
                                    >
                                        <Crown
                                            size={32}
                                            className="
                                                text-yellow-400
                                                drop-shadow-[0_0_12px_rgba(250,204,21,.7)]
                                            "
                                        />
                                    </div>
                                )}

                                {/* Team Name */}

                                <div
                                    className="
                                        text-xl
                                        font-black
                                        text-white
                                        mb-5
                                    "
                                >
                                    {formatTeamName(team.name)}
                                </div>

                                {/* Avatar Group */}

                                <div
                                    className="
                                        flex
                                        -space-x-4
                                        mb-4
                                    "
                                >
                                    {members.map(
                                        (member: ViewPlayer) => (
                                            <div
                                                key={member.id}
                                                className={`
                                                    w-14
                                                    h-14
                                                    rounded-full
                                                    flex
                                                    items-center
                                                    justify-center
                                                    shadow-lg
                                                    ${isWinner
                                                        ? "bg-yellow-400 text-black border"
                                                        : "bg-black text-white border border-white"
                                                    }
                                                `}
                                            >
                                                {member.id ===
                                                HUMAN_PLAYER_ID ? (
                                                    <User size={24} />
                                                ) : (
                                                    <Bot size={24} />
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Members */}

                                <div
                                    className="
                                        text-center
                                        text-sm
                                        text-white/70
                                        mb-6
                                    "
                                >
                                    {members
                                        .map(
                                            (m: ViewPlayer) =>
                                                m.id ===
                                                HUMAN_PLAYER_ID
                                                    ? "You"
                                                    : m.name
                                        )
                                        .join(" + ")}
                                </div>

                                {/* Stats */}

                                <div
                                    className="
                                        grid
                                        grid-cols-3
                                        gap-3
                                        w-full
                                    "
                                >
                                    {/* Round Tricks */}

                                    <div
                                        className="
                                            rounded-2xl
                                            bg-white/5
                                            p-3
                                            text-center
                                        "
                                    >
                                        <div
                                            className="
                                                text-[10px]
                                                uppercase
                                                tracking-wider
                                                text-white/50
                                            "
                                        >
                                            This Round
                                        </div>

                                        <div
                                            className="
                                                text-2xl
                                                font-black
                                                text-white
                                                mt-1
                                            "
                                        >
                                            {
                                                team.tricksWonThisRound
                                            }
                                        </div>
                                    </div>

                                    {/* Total Tricks */}

                                    <div
                                        className="
                                            rounded-2xl
                                            bg-white/5
                                            p-3
                                            text-center
                                        "
                                    >
                                        <div
                                            className="
                                                text-[10px]
                                                uppercase
                                                tracking-wider
                                                text-white/50
                                            "
                                        >
                                            Total Trick
                                        </div>

                                        <div
                                            className="
                                                text-2xl
                                                font-black
                                                text-white
                                                mt-1
                                            "
                                        >
                                            {
                                                team.totalTricksWon
                                            }
                                        </div>
                                    </div>

                                    {/* Rounds Won */}

                                    <div
                                        className="
                                            rounded-2xl
                                            bg-white/5
                                            p-3
                                            text-center
                                        "
                                    >
                                        <div
                                            className="
                                                text-[10px]
                                                uppercase
                                                tracking-wider
                                                text-white/50
                                            "
                                        >
                                            Rounds won
                                        </div>

                                        <div
                                            className="
                                                text-2xl
                                                font-black
                                                text-yellow-300
                                                mt-1
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
                    })}
                </div>
            </div>
        </div>
    );
}