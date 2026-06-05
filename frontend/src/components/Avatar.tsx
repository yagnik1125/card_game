interface Props {
    player: any;
    champion: boolean;
    active: boolean;
}

export default function Avatar({
    player,
    champion,
    active
}: Props) {
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
            {champion && (
                <div className="
                    absolute
                    -top-1
                    -left-2
                    w-[clamp(1.5rem,4vw,1.5rem)]
                    h-[clamp(1.5rem,4vw,1.5rem)]
                    text-[clamp(1.2rem,1vw,.9rem)]
                    rounded-full
                    text-black
                    flex
                    items-center
                    justify-center
                    font-bold
                ">
                    👑
                </div>
            )}
            <div className={`
                w-[clamp(2rem,5vw,5rem)]
                h-[clamp(2rem,5vw,5rem)]
                rounded-full
                flex
                items-center
                justify-center
                text-2xl
                border
                ${active?"bg-yellow-400 text-black":"bg-pink-700"}
                transition-all
            `}>
                {player.id === "P1" ? "Y" : player?.name?.[0] ?? '?'}
            </div>
            <div className="
                absolute
                -top-1
                -right-2
                border
                w-[clamp(1.5rem,2vw,1.5rem)]
                h-[clamp(1.5rem,2vw,1.5rem)]
                text-[clamp(.65rem,1vw,.9rem)]
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