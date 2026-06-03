import Avatar from "react-avatar";

interface Props {
    player: any;
}

export default function BotArea({
    player,
}: Props) {

    if (!player) {
        return null;
    }

    return (

        <div

            className="
flex
flex-col
items-center
gap-2
"

        >

            <Avatar

                name={player.name}

                round

                size="70"

            />

            <div className="font-semibold">

                {player.name}

            </div>

            <div className="text-sm">

                {player.tricksWonRound}

                {" "}

                tricks

            </div>

            <div className="text-xs opacity-70">

                Cards:

                {" "}

                {player.cardsRemaining}

            </div>

        </div>

    )

}