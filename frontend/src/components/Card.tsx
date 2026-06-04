import { suitMap, rankText } from "@/utils/constants";

interface Props {
    card: any;
    disabled?: boolean;
    trumpSuit: string;
    onClick?: () => void;
}

export default function Card({ card, disabled, trumpSuit, onClick }: Props) {
    const red = card.suit === "HEARTS" || card.suit === "DIAMONDS";

    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`
                w-16
                h-24
                rounded-xl
                border
                ${trumpSuit && card.suit === trumpSuit ? "bg-green-400" : "bg-white"}
                shadow-xl
                p-1
                flex
                flex-col
                justify-between
                ${disabled ? "opacity-40" : ""}
            `}
        >
            <div className={`font-bold text-sm self-start ${red ? "text-red-600" : "text-black"}`}>
                {rankText(card.rank)}
            </div>

            <div className={`text-5xl text-center ${red ? "text-red-600" : "text-black"}`}>
                {suitMap[card.suit]}
            </div>

            <div className={`font-bold text-sm self-end ${red ? "text-red-600" : "text-black"}`}>
                {rankText(card.rank)}
            </div>
        </button>
    );
}