const SEAT_DECK_OFFSET: Record<"top" | "left" | "right", () => { dx: number; dy: number }> = {
    top: () => ({
        dx: 0,
        dy: Math.min(window.innerHeight * 0.96 * 0.42, 320),
    }),
    left: () => ({
        dx: -Math.min(Math.min(window.innerWidth * 0.98, 425) * 0.43, 185),
        dy: 0,
    }),
    right: () => ({
        dx: Math.min(Math.min(window.innerWidth * 0.98, 425) * 0.43, 185),
        dy: 0,
    }),
};

export const BotCards = ({
    count,
    vertical = false,
    dealing = false,
    seat,
}: {
    count: number;
    vertical?: boolean;
    dealing?: boolean;
    seat: "top" | "left" | "right";
}) => {
    const deckOffset = SEAT_DECK_OFFSET[seat]();
    return (
        <div
            className={`
                flex
                ${vertical ? "flex-col" : ""}
                pointer-events-none
            `}
        >
            {
                Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className={`
                            w-7
                            h-10
                            rounded-md
                            border
                            border-amber-200/25
                            bg-linear-to-br
                            from-red-600
                            to-red-950
                            shadow-md
                            shadow-black/40
                            relative
                            overflow-hidden
                            transition-all
                            duration-700
                            ease-out
                            will-change-transform
                        `}
                        style={{
                            marginLeft:
                                !vertical && i !== 0
                                    ? -10
                                    : 0,

                            marginTop:
                                vertical && i !== 0
                                    ? -20
                                    : -25,
                            transform:
                                dealing
                                    ? `translate(${deckOffset.dx}px, ${deckOffset.dy}px) scale(0.3)`
                                    : undefined,
                            opacity: dealing ? 0 : 1,
                            transitionDelay: `${i * 80}ms`,
                        }}
                    >
                        <div className="
                            absolute
                            inset-[3px]
                            rounded
                            border
                            border-red-300/20
                        " />
                        <div className="
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                            text-[0.6rem]
                            text-amber-200/40
                        ">
                            ◆
                        </div>
                    </div>
                ))
            }
        </div>
    );
};
