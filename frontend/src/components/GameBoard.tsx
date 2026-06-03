import PlayerHand from "./PlayerHand";

interface Props {
    snapshot: any;
    onPlay: (cardId: string) => void;
}

export default function GameBoard({
    snapshot,
    onPlay,
}: Props) {

    const player = snapshot.players.find((p: any) => p.id === "P1");
    const left = snapshot.players.find((p: any) => p.id === "P2");
    const top = snapshot.players.find((p: any) => p.id === "P3");
    const right = snapshot.players.find((p: any) => p.id === "P4");

    return (

        <div className="bg-green-900 min-h-screen flex justify-center py-4">

            <div className="
        w-[95vw]
        max-w-450
        h-[88vh]
        rounded-3xl
        border-4
        border-green-400
        bg-green-700
        relative
      ">

                {/* TOP LEFT */}

                <div className="absolute left-8 top-8 text-white font-bold text-2xl">

                    <div>
                        Round: {snapshot.roundNumber}
                    </div>

                    <div>
                        Trump: {snapshot.trumpSuit || "-"}
                    </div>

                    <div>
                        Champion: {snapshot.champion || "-"}
                    </div>

                </div>


                {/* TOTAL */}

                <div className="absolute right-8 top-8 text-right text-white">

                    <div className="text-3xl font-bold mb-2">
                        Total Tricks
                    </div>

                    {snapshot.players.map((p: any) => (
                        <div key={p.id}>
                            {p.name}: {p.totalTricks}
                        </div>
                    ))}

                </div>


                {/* PLAYERS */}

                <div className="absolute top-10 left-1/2 -translate-x-1/2">
                    <Avatar
                        player={top}
                        active={snapshot.currentPlayerId === "P3"}
                    />
                </div>

                <div className="absolute left-24 top-1/2 -translate-y-1/2">
                    <Avatar
                        player={left}
                        active={snapshot.currentPlayerId === "P2"}
                    />
                </div>

                <div className="absolute right-24 top-1/2 -translate-y-1/2">
                    <Avatar
                        player={right}
                        active={snapshot.currentPlayerId === "P4"}
                    />
                </div>


                {/* CENTER TABLE */}

                <div className="
          absolute
          left-1/2
          top-[48%]
          -translate-x-1/2
          -translate-y-1/2
          w-130
          h-60
          rounded-full
          border-4
          border-green-400
        "/>


                {/* HAND */}

                <div className="
          absolute
          bottom-12
          left-1/2
          -translate-x-1/2
          w-full
        ">

                    <PlayerHand
                        cards={player.hand || []}
                        legalMoves={snapshot.legalMoves}
                        onPlay={onPlay}
                    />

                </div>


                {/* HUMAN AVATAR */}

                <div className="
          absolute
          -bottom-20
          left-1/6
          -translate-x-1/2
        ">

                    <Avatar
                        player={player}
                        active={snapshot.currentPlayerId === "P1"}
                    />

                </div>

            </div>

        </div>

    );

}



function Avatar({
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
        w-20
        h-20
        rounded-full
        flex
        items-center
        justify-center
        text-4xl

        ${active
                    ?
                    "bg-yellow-400 text-black scale-110 shadow-2xl"
                    :
                    "bg-pink-700"
                }

        transition-all
      `}>

                {
                    player.id === "P1"
                        ? "Y"
                        : player.name[0]
                }

            </div>

            <div className="
        absolute
        -top-3
        -right-1
        border

        w-10
        h-10

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

            <div className="mt-2 font-bold text-2xl">

                {
                    player.id === "P1"
                        ? "You"
                        : player.name
                }

            </div>

        </div>

    )

}