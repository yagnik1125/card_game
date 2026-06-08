import { suitMap, rankText } from "@/utils/constants";

interface Props {
    card: any;
    disabled?: boolean;
    trumpSuit: string;
    onClick?: () => void;
}

export default function Card({ card, disabled, trumpSuit, onClick }: Props) {
    const bgClass = disabled
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
                text-[4rem]
                opacity-[0.16]
                pointer-events-none
            ">
                {suitMap[card.suit]}
            </div>

            <div className={`font-bold text-[0.8em] self-start`}>
                {rankText(card.rank)}
            </div>

            <div className={`text-[3em] leading-none text-center`}>
                {suitMap[card.suit]}
            </div>

            <div className={`font-bold text-[0.8em] self-end rotate-180`}>
                {rankText(card.rank)}
            </div>
        </button>
    );
}