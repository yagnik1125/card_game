import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

interface Props {
    playerId: string | null;
}

export default function TrickWinnerModal({ playerId }: Props) {
    if (!playerId) return null;

    const snapshot = useSelector(
        (state: RootState) => state.game.snapshot
    );

    const player = snapshot?.players.find((p: any) => p.id === playerId);
    const playerName = playerId === "P1" ? "You" : player?.name || "Unknown";

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
                border-green-400
                shadow-2xl
                flex
                flex-col
                items-center
                gap-6
            ">
                <div className="text-white text-center">
                    <div className="text-sm uppercase tracking-widest text-green-300 mb-4">
                        Trick Won By
                    </div>
                    <div className="text-4xl font-bold text-green-200">
                        {playerName}
                    </div>
                </div>
            </div>
        </div>
    );
}
