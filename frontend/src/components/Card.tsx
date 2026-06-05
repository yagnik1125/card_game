import { suitMap, rankText } from "@/utils/constants";

interface Props {
    card: any;
    disabled?: boolean;
    trumpSuit: string;
    onClick?: () => void;
}

export default function Card({ card, disabled, trumpSuit, onClick }: Props) {
    const red = card.suit === "HEARTS" || card.suit === "DIAMONDS";
    const bgClass =
        disabled
            ? card.suit === trumpSuit
                ? "bg-green-700"
                : "bg-gray-400"
            : card.suit === trumpSuit
                ? "bg-green-400"
                : "bg-white";

    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`
                aspect-2.5/3.5
                w-[8vw]
                max-w-17.5
                min-w-11.25
                rounded-xl
                border
                shadow-xl
                p-[6%]
                flex
                flex-col
                justify-between
                ${bgClass}
                ${disabled ? "cursor-not-allowed" : "cursor-pointer -translate-y-2"}
            `}
        >
            <div className={`font-bold text-[0.8em] self-start ${red ? "text-red-600" : "text-black"}`}>
                {rankText(card.rank)}
            </div>

            <div className={`text-[3.2em] leading-none text-center ${red ? "text-red-600" : "text-black"}`}>
                {suitMap[card.suit]}
            </div>

            <div className={`font-bold text-[0.8em] self-end ${red ? "text-red-600" : "text-black"}`}>
                {rankText(card.rank)}
            </div>
        </button>
    );
}