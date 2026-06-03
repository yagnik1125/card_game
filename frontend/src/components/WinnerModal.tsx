interface Props {
    winner: any;
}

export default function WinnerModal({
    winner
}: Props) {
    if (!winner) {
        return null;
    }
    return (
        <div
            className="
                fixed
                inset-0
                bg-black/70
                flex
                items-center
                justify-center
                z-50
            "
        >
            <div
                className="
                    bg-white
                    rounded-xl
                    p-10
                    text-black
                "
            >
                <h1
                    className="
                        text-3xl
                        font-bold
                    "
                >
                    Game Finished
                </h1>
                <div className="mt-4">
                    Winner Declared
                </div>
            </div>
        </div>
    )
}