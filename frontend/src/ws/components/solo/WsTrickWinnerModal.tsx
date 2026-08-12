import { useSelector, useDispatch } from "react-redux";
import { HUMAN_PLAYER_ID } from "@/utils/constants";
import { setTrickWinner } from "@/store/slices/wsGameSlice";
import { selectSnapshot } from "@/ws/store/selectors";
import { useModalA11y } from "@/ws/hooks/useModalA11y";
import type { TrickWinner } from "@/ws/dto/winners";
import {
    Trophy,
    Crown,
    Bot,
    User,
    Sparkles,
} from "lucide-react";

interface Props {
    trickWinner: TrickWinner | null;
}

export default function WsTrickWinnerModal({
    trickWinner,
}: Props) {
    const snapshot = useSelector(selectSnapshot);
    const dispatch = useDispatch();
    const a11y = useModalA11y(
        !!trickWinner && !!snapshot,
        () => dispatch(setTrickWinner(null))
    );

    if (!trickWinner || !snapshot) {
        return null;
    }

    const isHuman = trickWinner.id === HUMAN_PLAYER_ID;

    const playerName = isHuman
        ? "You"
        : trickWinner.name ?? "Unknown";

    return (
        <div
            {...a11y}
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
                    {/* Trophy */}
                    <div className="
                        relative
                        flex
                        items-center
                        justify-center
                    ">
                        <div className="
                            absolute
                            w-20
                            h-20
                            rounded-full
                            bg-green-400/15
                            animate-pulse
                        " />

                        <Trophy
                            size={42}
                            className="
                                text-green-400
                                drop-shadow-[0_0_15px_rgba(34,197,94,.7)]
                            "
                        />
                    </div>

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
                    </div>

                    {/* Reward Badge */}
                    <div className="
                        flex
                        items-center
                        gap-2

                        rounded-full
                        px-5
                        py-2

                        bg-green-500/15
                        border
                        border-green-400/20
                    ">
                        <Sparkles
                            size={16}
                            className="text-green-300"
                        />

                        <span className="
                            text-green-200
                            font-bold
                            text-lg
                        ">
                            +1 Trick
                        </span>
                    </div>

                    {/* Current Round Tricks */}
                    <div className="
                        flex
                        items-center
                        gap-2
                        text-sm
                        text-white/70
                    ">
                        Tricks This Round

                        <span className="
                            text-white
                            font-bold
                            text-lg
                        ">
                            {trickWinner.tricksWonThisRound ?? 0}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}