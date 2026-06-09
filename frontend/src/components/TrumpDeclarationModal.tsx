import {
    Sparkles
} from "lucide-react";

import {
    suitMap,
} from "@/utils/constants";

interface Props {
    suit: string | null;
}

export default function TrumpDeclarationModal({
    suit,
}: Props) {
    if (!suit) return null;

    const suitColor =
        suit === "HEARTS"
            ? "text-red-400"
            : suit === "DIAMONDS"
                ? "text-pink-400"
                : suit === "CLUBS"
                    ? "text-green-400"
                    : "text-blue-400";

    const glowColor =
        suit === "HEARTS"
            ? "shadow-[0_0_80px_rgba(248,113,113,.45)]"
            : suit === "DIAMONDS"
                ? "shadow-[0_0_80px_rgba(244,114,182,.45)]"
                : suit === "CLUBS"
                    ? "shadow-[0_0_80px_rgba(74,222,128,.45)]"
                    : "shadow-[0_0_80px_rgba(96,165,250,.45)]";

    return (
        <div
            className="
                fixed
                inset-0
                z-200
                flex
                items-center
                justify-center
                pointer-events-none
            "
        >
            {/* Overlay */}
            <div
                className="
                    absolute
                    inset-0
                    bg-black/50
                    backdrop-blur-sm
                    animate-in
                    fade-in
                    duration-300
                "
            />

            {/* Ring 1 */}
            <div
                className="
                    absolute
                    w-[24rem]
                    h-96
                    rounded-full
                    border
                    border-yellow-400/20
                    animate-ping
                "
            />

            {/* Ring 2 */}
            <div
                className="
                    absolute
                    w-[18rem]
                    h-72
                    rounded-full
                    border
                    border-yellow-300/25
                    animate-pulse
                "
            />

            {/* Main Card */}
            <div
                className={`
                    relative
                    overflow-hidden

                    rounded-4xl
                    border
                    border-yellow-400/30

                    bg-black/80
                    backdrop-blur-xl

                    px-12
                    py-10

                    animate-in
                    zoom-in
                    fade-in

                    duration-300

                    ${glowColor}
                `}
            >
                {/* Decorative Gradient */}
                <div
                    className="
                        absolute
                        inset-0
                        bg-linear-to-br
                        from-yellow-400/10
                        via-transparent
                        to-yellow-200/10
                    "
                />

                {/* Top Glow */}
                <div
                    className="
                        absolute
                        top-0
                        left-0
                        right-0
                        h-24
                        bg-linear-to-b
                        from-yellow-400/10
                        to-transparent
                    "
                />

                <div
                    className="
                        relative
                        flex
                        flex-col
                        items-center
                        text-center
                        gap-6
                    "
                >
                    {/* ACE of trump */}
                    <div
                        className="
                            relative
                            w-21
                            h-28
                            rounded-2xl

                            bg-white
                            border-2
                            border-yellow-400

                            shadow-[0_0_40px_rgba(250,204,21,.4)]

                            flex
                            flex-col
                            items-center
                            justify-center
                        "
                    >
                        <div
                            className="
                                absolute
                                top-2
                                left-2
                                text-lg
                                font-black
                                text-black
                            "
                        >
                            A
                        </div>

                        <div
                            className={`
                                text-4xl
                                ${suitColor}
                            `}
                        >
                            {suitMap[suit]}
                        </div>

                        <div
                            className="
                            absolute
                            bottom-2
                            right-2
                            rotate-180
                            text-lg
                            font-black
                            text-black
                        "
                        >
                            A
                        </div>
                    </div>

                    {/* Label */}
                    <div>
                        <div
                            className="
                                uppercase
                                tracking-[0.4em]
                                text-yellow-300
                                text-xs
                                font-bold
                                mb-2
                            "
                        >
                            Trump Declared
                        </div>

                        {/* <div
                            className="
                                text-4xl
                                font-black
                                text-white
                            "
                        >
                            New Trump Suit
                        </div> */}
                    </div>

                    {/* Suit */}
                    <div
                        className="
                            relative
                            flex
                            flex-col
                            items-center
                            gap-2
                        "
                    >
                        <div
                            className={`
                                text-[7rem]
                                leading-none
                                ${suitColor}
                                drop-shadow-[0_0_25px_rgba(255,255,255,.3)]
                            `}
                        >
                            {suitMap[suit]}
                        </div>

                        <div
                            className={`
                                text-3xl
                                font-black
                                tracking-wider
                                ${suitColor}
                            `}
                        >
                            {suit}
                        </div>
                    </div>

                    {/* Badge */}
                    <div
                        className="
                            flex
                            items-center
                            gap-2

                            rounded-full
                            px-4
                            py-2

                            border
                            border-yellow-400/20

                            bg-yellow-400/10
                        "
                    >
                        <Sparkles
                            size={16}
                            className="text-yellow-300"
                        />

                        <span
                            className="
                                text-yellow-200
                                font-semibold
                            "
                        >
                            Trump Activated
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}