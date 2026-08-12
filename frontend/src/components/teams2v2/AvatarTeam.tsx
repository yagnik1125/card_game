import {
    Crown,
    User,
    Bot
} from "lucide-react";
import { HUMAN_PLAYER_ID } from "@/utils/constants";

interface Props {
    player: any;
    champion: boolean;
    active: boolean;
    teamName: string;
}

export default function AvatarTeam({
    player,
    champion,
    active,
    teamName,
}: Props) {
    if (!player) return null;

    const isHuman = player.id === HUMAN_PLAYER_ID;

    return (
        <div className="flex flex-col items-center text-white relative select-none">

            {/* Champion Badge */}
            {champion && (
                <div className="
                    absolute
                    z-20
                    -left-2
                    -top-1
                    bg-linear-to-br
                    from-yellow-300
                    to-amber-500
                    text-black
                    rounded-full
                    p-[clamp(0.2rem,0.8vw,0.35rem)]
                    shadow-lg
                    shadow-yellow-500/40
                    border
                    border-yellow-100
                    rotate-[-8deg]
                ">
                    <Crown
                        size={clampIcon(0.9, 1.2, 1.4) * 10}
                        className="drop-shadow-sm"
                    />
                </div>
            )}

            {/* Avatar Ring Wrapper */}
            <div
                className={`
                    relative
                    rounded-full
                    flex
                    items-center
                    justify-center
                    transition-all
                    duration-300

                    w-[clamp(2.8rem,6vw,4.5rem)]
                    h-[clamp(2.8rem,6vw,4.5rem)]

                    ${active
                        ? "bg-amber-400/20 ring-2 ring-amber-300 shadow-lg shadow-amber-400/30"
                        : "bg-white/10 ring-1 ring-white/15"
                    }
                `}
            >
                {/* Expanding pulse ring (active player) */}
                {active && (
                    <>
                        <span
                            className="
                                absolute
                                inset-0
                                rounded-full
                                ring-2
                                ring-amber-300/70
                                animate-avatar-ring
                            "
                        />
                        <span
                            className="
                                absolute
                                -inset-1
                                rounded-full
                                bg-amber-300/20
                                blur-lg
                                animate-pulse
                            "
                        />
                    </>
                )}

                {/* Inner Avatar */}
                <div className={`
                    w-[85%]
                    h-[85%]
                    rounded-full
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-[clamp(0.9rem,2vw,1.2rem)]
                    transition-all

                    ${active
                        ? "bg-linear-to-br from-amber-300 to-yellow-500 text-black shadow-inner"
                        : isHuman
                            ? "bg-linear-to-br from-emerald-500 to-teal-700 text-white"
                            : "bg-linear-to-br from-pink-600 to-purple-700 text-white"
                    }
                `}>
                    {isHuman
                        ? <User size={clampIcon(1, 1.3, 1.6) * 30} />
                        : <Bot size={clampIcon(1, 1.3, 1.6) * 30} />
                    }
                </div>
            </div>

            {/* Trick Counter */}
            <div className="
                absolute
                -top-1
                -right-2
                bg-black/70
                backdrop-blur-md
                border
                border-amber-200/25
                text-amber-100
                rounded-full
                px-2
                py-0.5
                text-[clamp(0.6rem,1vw,0.75rem)]
                font-bold
                shadow-md
            ">
                {player.tricksWonRound}
            </div>

            {/* Team Badge */}
            <div className="
                absolute
                bottom-5
                -right-2
                bg-black/70
                backdrop-blur-md
                border
                border-white/15
                text-amber-100
                rounded-full
                px-2
                py-0.5
                text-[clamp(0.6rem,1vw,0.75rem)]
                font-semibold
                shadow-md
            ">
                {teamName}
            </div>

            {/* Name */}
            <div className="
                mt-0.5
                px-2.5
                py-0.5
                rounded-full
                bg-black/35
                backdrop-blur-md
                border
                border-white/10
                text-center
                font-semibold
                text-[clamp(0.7rem,1.1vw,0.9rem)]
                tracking-wide
                text-white/90
            ">
                {isHuman ? "You" : player.name}
            </div>
        </div>
    );
}

function clampIcon(min: number, mid: number, max: number): number {
    return Math.min(max, Math.max(min, mid));
}
