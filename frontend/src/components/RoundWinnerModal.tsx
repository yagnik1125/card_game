import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
    Crown,
    Trophy,
    Bot,
    User,
} from "lucide-react";

interface Props {
    roundWinner: any | null;
}

export default function RoundWinnerModal({
    roundWinner,
}: Props) {
    if (!roundWinner) return null;

    const winnerName = roundWinner.id === "P1" ? "You" : roundWinner.name ?? "Unknown";

    return (
        <div
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
                            mx-auto
                            w-20
                            h-20
                            rounded-full
                            bg-yellow-500/15
                            flex
                            items-center
                            justify-center
                            mb-4
                        "
                    >
                        <Trophy
                            size={40}
                            className="text-yellow-400"
                        />
                    </div>

                    <div
                        className="
                            text-xs
                            uppercase
                            tracking-[0.35em]
                            text-yellow-300
                        "
                    >
                        Round Winner
                    </div>

                    <div
                        className="
                            text-4xl
                            font-black
                            text-white
                            mt-2
                        "
                    >
                        {winnerName}
                    </div>
                </div>

                {/* Players */}

                <div
                    className="
                        grid
                        grid-cols-4
                        gap-4
                    "
                >
                    {roundWinner.players.map((player: any) => {
                        const isWinner =
                            player.id === roundWinner.id;

                        const isHuman =
                            player.id === "P1";

                        return (
                            <div
                                key={player.id}
                                className={`
                                    relative
                                    rounded-3xl
                                    border
                                    p-4
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
                                {isWinner && (
                                    <div
                                        className="
                                            absolute
                                            -top-3
                                            text-yellow-400
                                        "
                                    >
                                        <Crown size={24} />
                                    </div>
                                )}

                                <div
                                    className={`
                                        w-14
                                        h-14
                                        rounded-full
                                        flex
                                        items-center
                                        justify-center

                                        ${isWinner
                                            ? "bg-yellow-400 text-black"
                                            : "bg-white/10 text-white"
                                        }
                                    `}
                                >
                                    {isHuman ? (
                                        <User size={24} />
                                    ) : (
                                        <Bot size={24} />
                                    )}
                                </div>

                                <div
                                    className="
                                        mt-2
                                        text-sm
                                        font-semibold
                                        text-white
                                        text-center
                                    "
                                >
                                    {isHuman
                                        ? "You"
                                        : player.name}
                                </div>

                                <div
                                    className="
                                        mt-3
                                        px-3
                                        py-1
                                        rounded-full
                                        bg-green-500/20
                                        border
                                        border-green-400/20
                                        text-green-300
                                        text-sm
                                        font-bold
                                    "
                                >
                                    {player.tricksWonThisRound}
                                </div>

                                <div
                                    className="
                                        text-[10px]
                                        uppercase
                                        tracking-wider
                                        text-white/50
                                        mt-1
                                    "
                                >
                                    Tricks
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}