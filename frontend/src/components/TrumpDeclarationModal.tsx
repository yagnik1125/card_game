import { suitMap } from "@/utils/constants";

interface Props {
    suit: string | null;
}

export default function TrumpDeclarationModal({ suit }: Props) {
    if (!suit) return null;

    return (
        <div className="
            fixed
            inset-0
            flex
            items-center
            justify-center
            z-50
            pointer-events-none
        ">
            <div className="
                animate-in
                fade-in
                zoom-in
                duration-300
                bg-black/80
                backdrop-blur-md
                rounded-3xl
                px-8
                py-12
                border-2
                border-yellow-400
                shadow-2xl
                flex
                flex-col
                items-center
                gap-6
            ">
                <div className="text-white text-center">
                    <div className="text-sm uppercase tracking-widest text-yellow-300 mb-2">
                        Trump Declared
                    </div>
                    <div className="text-6xl mb-4">
                        {suitMap[suit]}
                    </div>
                    <div className="text-2xl font-bold text-yellow-200">
                        {suit}
                    </div>
                </div>
            </div>
        </div>
    );
}
