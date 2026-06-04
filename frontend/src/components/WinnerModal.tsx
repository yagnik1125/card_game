interface Props {
    winner: any;
}

export default function WinnerModal({
    winner,
}: Props) {

    if (!winner) {
        return null;
    }

    const matchWinner =
        winner.players.reduce(
            (best: any, current: any) =>
                current.totalTricks >
                best.totalTricks
                    ? current
                    : best
        );

    return (
        <div className="
            fixed
            inset-0
            bg-black/70
            flex
            items-center
            justify-center
            z-50
        ">
            <div className="
                bg-white
                p-10
                rounded-xl
                text-center
            ">
                <h1 className="
                    text-4xl
                    font-bold
                    mb-4
                ">
                    Match Complete
                </h1>

                <div className="text-xl">
                    Winner:
                </div>

                <div className="
                    text-3xl
                    font-bold
                    mt-2
                ">
                    {matchWinner.name}
                </div>

                <div className="mt-4">
                    Total Tricks:
                    {" "}
                    {matchWinner.totalTricks}
                </div>
            </div>
        </div>
    );
}