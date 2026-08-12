import { suitMap, rankText } from "@/utils/constants";
import { Lock } from "lucide-react";

interface Props {
    card: any;
    disabled?: boolean;
    trumpSuit: string;
    onClick?: () => void;
}

export default function Card({ card, disabled, trumpSuit, onClick }: Props) {
    const suitColor = card.suit === "HEARTS" || card.suit === "DIAMONDS" ? "text-red-600" : "text-black";
    const isTrump = card.suit === trumpSuit;
    const bgClass = disabled
        ? "bg-linear-to-br from-slate-300 via-slate-400 to-slate-500"
        : isTrump
            ? "bg-linear-to-br from-yellow-200 via-amber-300 to-yellow-400"
            : "bg-linear-to-br from-white via-[#fdfcf8] to-stone-200";

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
                ${disabled ? "border-slate-600/70" : isTrump ? "border-amber-500" : "border-black/70"}
                ${
                    disabled
                        ? "shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                        : isTrump
                            ? "shadow-[0_0_18px_rgba(250,204,21,0.55),0_8px_20px_rgba(0,0,0,0.3)]"
                            : "shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
                }
                overflow-hidden
                transition-all
                duration-200
                ${bgClass}
                ${
                    disabled
                        ? "cursor-not-allowed saturate-0"
                        : "cursor-pointer -translate-y-2 hover:-translate-y-3 hover:scale-105 hover:shadow-[0_14px_30px_rgba(0,0,0,0.4)] active:scale-95"
                }
            `}
        >
            {/* inner hairline */}
            <div className={`
                absolute
                inset-[3px]
                rounded-lg
                border
                ${disabled ? "border-black/15" : "border-black/10"}
                pointer-events-none
            `} />

            {/* top-left corner */}
            <div className={`
                absolute
                top-[5%]
                left-[8%]
                flex
                flex-col
                items-center
                leading-none
                pointer-events-none
                ${disabled ? "text-black/60" : suitColor}
            `}>
                <span className="text-[0.72em] font-black">{rankText(card.rank)}</span>
                <span className="text-[0.62em] -mt-px">{suitMap[card.suit]}</span>
            </div>

            {/* center pip with glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[46%] aspect-square rounded-full bg-white/50 blur-sm" />
                <span className={`absolute text-[2.2em] leading-none ${disabled ? "text-black/55" : suitColor} drop-shadow-sm`}>
                    {suitMap[card.suit]}
                </span>
            </div>

            {/* bottom-right corner */}
            <div className={`
                absolute
                bottom-[5%]
                right-[8%]
                flex
                flex-col
                items-center
                leading-none
                rotate-180
                pointer-events-none
                ${disabled ? "text-black/60" : suitColor}
            `}>
                <span className="text-[0.72em] font-black">{rankText(card.rank)}</span>
                <span className="text-[0.62em] -mt-px">{suitMap[card.suit]}</span>
            </div>

            {/* disabled lock styling */}
            {disabled && (
                <>
                    <div className="
                        absolute
                        inset-0
                        opacity-40
                        pointer-events-none
                        [background-image:repeating-linear-gradient(45deg,rgba(0,0,0,0.09)_0,rgba(0,0,0,0.09)_5px,transparent_5px,transparent_11px)]
                    " />
                    <div className="
                        absolute
                        bottom-[7%]
                        left-1/2
                        -translate-x-1/2
                        flex
                        items-center
                        gap-0.5
                        rounded-full
                        bg-black/35
                        px-1.5
                        py-0.5
                        pointer-events-none
                    ">
                        <Lock size={8} strokeWidth={3.5} className="text-white/80" />
                    </div>
                </>
            )}
        </button>
    );
}
