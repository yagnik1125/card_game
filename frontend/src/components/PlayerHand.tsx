interface Props {
    cards: any[];
    legalMoves: string[];
    onPlay: (cardId: string) => void;
}

const suitMap: any = {
    HEARTS: "♥",
    DIAMONDS: "♦",
    CLUBS: "♣",
    SPADES: "♠",
};

function rankText(rank: number) {
    if (rank === 11) return "J";
    if (rank === 12) return "Q";
    if (rank === 13) return "K";
    if (rank === 14) return "A";
    return rank;
}
export default function PlayerHand({
    cards,
    legalMoves,
    onPlay,
}: Props) {
    return (
        <div className="
            flex
            justify-center
            gap-2
        ">
            {cards.map(card => {
                const legal = legalMoves.includes(card.id);
                const red = card.suit === "HEARTS" || card.suit === "DIAMONDS";
                return (
                    <button
                        key={card.id}
                        disabled={!legal}
                        onClick={() =>
                            onPlay(card.id)
                        }
                        className={`
                            w-23.75
                            h-35
                            rounded-xl
                            bg-white
                            border-2
                            shadow-xl
                            flex
                            flex-col
                            justify-between
                            p-2
                            transition
                            hover:-translate-y-4
                            ${legal
                                ? "cursor-pointer"
                                : "opacity-40"
                            }
                        `}
                    >
                        <div className={`
                            text-xl
                            font-bold
                            self-start
                            ${red
                                ? "text-red-600"
                                : "text-black"
                            }
                        `}>
                            {rankText(card.rank)}
                        </div>
                        <div className={`
                            text-5xl
                            font-bold
                            text-center
                            ${red
                                ? "text-red-600"
                                : "text-black"
                            }
                        `}>
                            {suitMap[card.suit]}
                        </div>
                        <div className={`
                            text-xl
                            font-bold
                            self-end
                            ${red
                                ? "text-red-600"
                                : "text-black"
                            }
                        `}>
                            {rankText(card.rank)}
                        </div>
                    </button>
                )
            })}
        </div>
    )
}