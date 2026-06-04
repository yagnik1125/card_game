export default function Avatar({
    player,
    active,
}: any) {
    if (!player) {
        return null;
    }
    return (
        <div className="
            flex
            flex-col
            items-center
            text-white
            relative
        ">
            <div className={`
                w-15
                h-15
                rounded-full
                flex
                items-center
                justify-center
                text-4xl
                border
                ${active
                    ? "bg-yellow-400 text-black scale-110 shadow-2xl"
                    : "bg-pink-700"
                }
                transition-all
            `}>
                {player.id === "P1" ? "Y" : player?.name?.[0] ?? '?'}
            </div>
            <div className="
                absolute
                -top-3
                -right-1
                border
                w-7
                h-7
                rounded-full
                bg-yellow-400
                text-black
                flex
                items-center
                justify-center
                font-bold
            ">
                {player.tricksWonRound}
            </div>
            <div className="font-bold text-lg">
                {player.id === "P1" ? "You" : player.name}
            </div>
        </div>
    )
}