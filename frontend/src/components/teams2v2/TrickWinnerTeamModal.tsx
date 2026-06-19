import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
    Crown,
    Bot,
    User,
} from "lucide-react";

interface Props {
    trickWinner: any | null;
    trickWinnerTeam: any | null;
}

export default function TrickWinnerTeamModal({
    trickWinner,
    trickWinnerTeam,
}: Props) {
    const snapshot = useSelector(
        (state: RootState) => state.game.snapshot
    );

    if (!trickWinner || !trickWinnerTeam || !snapshot) {
        return null;
    }

    const isHuman = trickWinner.id === "P1";

    const playerName = isHuman
        ? "You"
        : trickWinner.name ?? "Unknown";

    return (
        <div
            className="
                fixed
                inset-0
                z-150
                flex
                items-center
                justify-center
                pointer-events-none
            "
        >
            {/* Dark Overlay */}
            <div className="
                absolute
                inset-0
                bg-black/35
                backdrop-blur-[2px]
                animate-in
                fade-in
                duration-300
            " />

            {/* Glow Rings */}
            <div className="
                absolute
                w-72
                h-72
                rounded-full
                border
                border-green-400/30
                animate-ping
            " />

            <div className="
                absolute
                w-56
                h-56
                rounded-full
                border
                border-green-300/20
                animate-pulse
            " />

            {/* Main Card */}
            <div
                className="
                    relative
                    overflow-hidden
                    rounded-4xl
                    border
                    border-green-400/30
                    bg-black/80
                    backdrop-blur-xl

                    px-10
                    py-8

                    shadow-[0_0_80px_rgba(34,197,94,.35)]

                    animate-in
                    zoom-in
                    fade-in
                    duration-300
                "
            >
                {/* Decorative Glow */}
                <div className="
                    absolute
                    inset-0
                    bg-linear-to-br
                    from-green-400/10
                    via-transparent
                    to-emerald-400/10
                " />

                <div className="
                    relative
                    flex
                    flex-col
                    items-center
                    text-center
                    gap-5
                ">

                    {/* Header */}
                    <div>
                        <div className="
                            uppercase
                            tracking-[0.35em]
                            text-green-300
                            text-xs
                            font-bold
                            mb-2
                        ">
                            Trick Winner
                        </div>

                        <div className="
                            text-white
                            text-4xl
                            font-black
                            tracking-tight
                        ">
                            {playerName}
                        </div>
                    </div>

                    {/* Avatar */}
                    <div className="
                        relative
                        w-24
                        h-24
                        rounded-full

                        bg-linear-to-br
                        from-green-500
                        to-emerald-700

                        flex
                        items-center
                        justify-center

                        border-4
                        border-white/15

                        shadow-[0_0_35px_rgba(34,197,94,.45)]
                    ">
                        {isHuman ? (
                            <User size={42} />
                        ) : (
                            <Bot size={42} />
                        )}

                        <div className="
                            absolute
                            -top-2
                            -right-2
                            w-10
                            h-10
                            rounded-full
                            bg-yellow-400
                            flex
                            items-center
                            justify-center
                            shadow-lg
                        ">
                            <Crown
                                size={18}
                                className="text-black"
                            />
                        </div>
                        <div className="
                            absolute
                            -bottom-2
                            -right-2
                            w-10
                            h-10
                            rounded-full
                            bg-yellow-400
                            flex
                            items-center
                            justify-center
                            shadow-lg
                            text-2xl
                        ">
                            {trickWinnerTeam.name}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="
                        w-full
                        grid
                        grid-cols-2
                        gap-4
                    ">
                        <div className="
                            rounded-2xl
                            border
                            border-green-400/20
                            bg-green-500/10
                            p-4
                        ">
                            <div className="
                                text-[11px]
                                uppercase
                                tracking-wider
                                text-green-300
                            ">
                                Player Tricks
                            </div>

                            <div className="
                                mt-2
                                text-3xl
                                font-black
                                text-white
                            ">
                                {trickWinner.tricksWonThisRound}
                            </div>

                            <div className="
                                text-xs
                                text-white/50
                            ">
                                This Round
                            </div>
                        </div>

                        <div className="
                            rounded-2xl
                            border
                            border-blue-400/20
                            bg-blue-500/10
                            p-4
                        ">
                            <div className="
                                text-[11px]
                                uppercase
                                tracking-wider
                                text-blue-300
                            ">
                                Team Tricks
                            </div>

                            <div className="
                                mt-2
                                text-3xl
                                font-black
                                text-white
                            ">
                                {trickWinnerTeam.tricksWonThisRound}
                            </div>

                            <div className="
                                text-xs
                                text-white/50
                            ">
                                This Round
                            </div>
                        </div>
                    </div>

                    <div className="
                        w-full
                        grid
                        grid-cols-2
                        gap-4
                    ">
                        <div className="
                            rounded-2xl
                            border
                            border-green-400/20
                            bg-green-500/10
                            p-4
                        ">
                            <div className="
                                text-[11px]
                                uppercase
                                tracking-wider
                                text-green-300
                            ">
                                Team Total Tricks
                            </div>

                            <div className="
                                mt-2
                                text-3xl
                                font-black
                                text-white
                            ">
                                {trickWinnerTeam.totalTricksWon}
                            </div>
                        </div>

                        <div className="
                            rounded-2xl
                            border
                            border-blue-400/20
                            bg-blue-500/10
                            p-4
                        ">
                            <div className="
                                text-[11px]
                                uppercase
                                tracking-wider
                                text-blue-300
                            ">
                                Rounds Won
                            </div>

                            <div className="
                                mt-2
                                text-3xl
                                font-black
                                text-white
                            ">
                                {trickWinnerTeam.roundsWon}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}