export default function GameLoader() {

    const suits = [
        { icon: "♠️", delay: "0s" },
        { icon: "♥️", delay: "-0.5s" },
        { icon: "♣️", delay: "-1s" },
        { icon: "♦️", delay: "-1.5s" },
    ];

    return (
        <div className="
            min-h-screen
            bg-slate-950
            flex
            items-center
            justify-center
        ">
            <div className="
                relative
                w-36
                h-36
            ">
                {suits.map((suit) => (
                    <div
                        key={suit.icon}

                        className="
                            absolute
                            inset-0
                        "
                        style={{
                            animation: `orbit 2s linear infinite`,
                            animationDelay: suit.delay
                        }}
                    >
                        <div
                            className="
                                absolute
                                left-1/2
                                top-0
                                -translate-x-1/2
                                text-5xl
                                font-bold
                            "
                        >
                            <span>
                                {suit.icon}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}