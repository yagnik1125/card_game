export const BotCards = ({
    count,
    vertical = false
}: {
    count: number;
    vertical?: boolean;
}) => (
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
                    className="
                        w-7
                        h-10
                        rounded-md
                        border
                        border-white/20
                        bg-linear-to-br
                        from-red-700
                        to-red-950
                        shadow-md
                    "
                    style={{
                        marginLeft:
                            !vertical && i !== 0
                                ? -10
                                : 0,

                        marginTop:
                            vertical && i !== 0
                                ? -20
                                : -25
                    }}
                />
            ))
        }
    </div>
);