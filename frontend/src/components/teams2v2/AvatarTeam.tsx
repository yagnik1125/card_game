import {
    Crown,
    User,
    Bot
} from "lucide-react";

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

    const isHuman = player.id === "P1";

    return (
        <div className="flex flex-col items-center text-white relative select-none">

            {/* Champion Badge */}
            {champion && (
                <div className="
                    absolute
                    z-20
                    -left-2
                    bg-yellow-400
                    text-black
                    rounded-full
                    p-[clamp(0.2rem,0.8vw,0.35rem)]
                    shadow-lg
                    border border-yellow-200
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
                        ? "bg-yellow-400/20 ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30"
                        : "bg-white/10 ring-1 ring-white/10"
                    }
                `}
            >
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
                        ? "bg-yellow-400 text-black"
                        : "bg-linear-to-br from-pink-600 to-purple-700 text-white"
                    }
                `}>
                    {isHuman
                        ? <User size={clampIcon(1, 1.3, 1.6) * 30} />
                        : <Bot size={clampIcon(1, 1.3, 1.6) * 30} />
                    }
                </div>

                {/* Online Pulse (for active player) */}
                {active && (
                    <>
                        <span
                            className="
                            absolute
                            -inset-2.5
                            rounded-full
                            bg-yellow-400/25
                            blur-xl
                            animate-pulse
                            -z-10
                        "
                        />

                        <span
                            className="
                            absolute
                            -inset-5
                            rounded-full
                            bg-yellow-300/10
                            blur-2xl
                            animate-pulse
                            -z-20
                        "
                        />
                    </>
                )}
            </div>

            {/* Trick Counter */}
            <div className="
                absolute
                -top-1
                -right-2
                bg-black/70
                backdrop-blur-md
                border border-white/10
                text-white
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
                border border-white/10
                text-white
                rounded-full
                px-2
                py-0.5
                text-[clamp(0.6rem,1vw,0.75rem)]
                shadow-md
            ">
                {teamName}
            </div>

            {/* Name */}
            <div className="
                text-center
                font-semibold
                text-[clamp(0.75rem,1.2vw,1rem)]
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