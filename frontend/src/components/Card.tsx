import { suitMap, rankText } from "@/utils/constants";

interface Props {
    card: any;
    disabled?: boolean;
    trumpSuit: string;
    onClick?: () => void;
}

export default function Card({ card, disabled, trumpSuit, onClick }: Props) {
    const suitColor = card.suit === "HEARTS" || card.suit === "DIAMONDS" ? "text-red-600" : "text-black";
    const bgClass = disabled
        ? card.suit === trumpSuit
            ? "bg-yellow-500"
            : "bg-gray-400"
        : card.suit === trumpSuit
            ? "bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.7)]"
            : "bg-white";

    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={`
                relative
                aspect-2.5/3.5
                w-[8vw]
                max-w-17.5
                min-w-11.25
                rounded-xl
                border
                border-black/75
                shadow-[0_8px_20px_rgba(0,0,0,0.25)]
                p-[6%]
                flex
                flex-col
                justify-between
                overflow-hidden
                transition-all
                duration-200
                ${bgClass}
                ${disabled ? "cursor-not-allowed blur-[0.5px]" : "cursor-pointer -translate-y-2"}
            `}
        >
            {/* subtle suit watermark */}
            <div className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                text-[3.5rem]
                opacity-[0.16]
                pointer-events-none
                rotate-12
            ">
                {suitMap[card.suit]}
            </div>

            <div className={`font-bold text-[0.85em] self-start ${suitColor}`}>
                {rankText(card.rank)}
            </div>

            <div className={`text-[2em] leading-none text-center rotate-12`}>
                {suitMap[card.suit]}
            </div>

            <div className={`font-bold text-[0.85em] self-end rotate-180 ${suitColor}`}>
                {rankText(card.rank)}
            </div>
        </button>
    );
}