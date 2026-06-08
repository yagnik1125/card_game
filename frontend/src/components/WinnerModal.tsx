import { setSnapshot, setWinner, setTrickCards, setAnimating, setDealing } from "@/store/slices/gameSlice";
import {
    Trophy,
    Home,
    X,
    Crown,
} from "lucide-react";
import { useDispatch } from "react-redux";

import {
    useNavigate
} from "react-router-dom";

interface Props {
    winner: any;
}

export default function WinnerModal({
    winner,
}: Props) {
    const dispatch = useDispatch();
    const navigate =
        useNavigate();

    if (!winner) {
        return null;
    }

    const closeModal = () => {
        dispatch(setSnapshot(null));
        dispatch(setWinner(null));
        dispatch(setTrickCards([]));
        dispatch(setAnimating(false));
        dispatch(setDealing(false));
        navigate("/");
    };

    const sortedPlayers =
        [...winner.players].sort(
            (a, b) =>
                b.totalTricks -
                a.totalTricks
        );

    const matchWinner =
        sortedPlayers[0];

    return (

        <div className="
            fixed
            inset-0
            z-100
            bg-black/75
            backdrop-blur-md
            flex
            items-center
            justify-center
            p-3
        ">

            <div className="
                relative
                w-full
                max-w-lg
                max-h-[92vh]
                overflow-hidden
                rounded-3xl
                border
                border-white/10
                bg-linear-to-b
                from-slate-900
                to-slate-950
                shadow-2xl
                flex
                flex-col
            ">

                {/* Close */}

                <button
                    onClick={() => closeModal}
                    className="
                        absolute
                        top-3
                        right-3
                        z-20
                        w-9
                        h-9
                        rounded-full
                        bg-white/10
                        hover:bg-white/20
                        flex
                        items-center
                        justify-center
                        text-white
                        cursor-pointer
                    "
                >
                    <X size={18} />
                </button>


                {/* Scroll Area */}

                <div className="
                    overflow-y-auto
                    flex-1
                    scrollbar-hide
                ">

                    {/* Hero */}

                    <div className="
                        px-6
                        pt-7
                        pb-6
                        text-center
                        border-b
                        border-white/10
                    ">

                        <div className="
                            mx-auto
                            mb-4
                            w-22
                            h-22
                            rounded-full
                            bg-yellow-400
                            flex
                            items-center
                            justify-center
                            shadow-xl
                        ">

                            <Trophy
                                size={42}
                                className="text-black"
                            />

                        </div>

                        <div className="
                            text-green-400
                            font-bold
                            uppercase
                            tracking-widest
                            text-xs
                        ">
                            Match Complete
                        </div>

                        <h1 className="
                            text-3xl
                            font-black
                            text-white
                            mt-2
                        ">
                            {matchWinner.id === "P1"
                                ? "You Won!"
                                : `${matchWinner.name} Wins`
                            }
                        </h1>

                        <div className="
                            mt-3
                            text-slate-400
                            text-sm
                        ">
                            Total Tricks Won
                        </div>

                        <div className="
                            text-4xl
                            font-black
                            text-white
                        ">
                            {matchWinner.totalTricks}
                        </div>

                    </div>


                    {/* Leaderboard */}

                    <div className="
                        p-5
                        space-y-3
                    ">

                        {sortedPlayers.map(
                            (
                                player,
                                index
                            ) => (

                                <div
                                    key={player.id}

                                    className={`
                                        rounded-2xl
                                        px-4
                                        py-3
                                        border
                                        flex
                                        items-center
                                        justify-between

                                        ${player.id === matchWinner.id
                                            ? `
                                            border-yellow-400/30
                                            bg-yellow-500/10
                                            `
                                            : `
                                            border-white/10
                                            bg-white/5
                                            `
                                        }
                                    `}
                                >

                                    <div className="
                                        flex
                                        items-center
                                        gap-3
                                    ">

                                        <div className="
                                            w-6
                                            text-slate-500
                                            font-bold
                                        ">
                                            #
                                            {index + 1}
                                        </div>

                                        <div className="
                                            w-11
                                            h-11
                                            rounded-full
                                            bg-green-600
                                            flex
                                            items-center
                                            justify-center
                                            text-white
                                            font-bold
                                        ">
                                            {player.id === "P1"
                                                ? "Y"
                                                : player.name[0]
                                            }
                                        </div>

                                        <div>

                                            <div className="
                                                text-white
                                                font-bold
                                                flex
                                                items-center
                                                gap-2
                                            ">

                                                {player.id === "P1"
                                                    ? "You"
                                                    : player.name
                                                }

                                                {player.id === matchWinner.id &&
                                                    <Crown
                                                        size={16}
                                                        className="
                                                            text-yellow-400
                                                        "
                                                    />
                                                }

                                            </div>

                                        </div>

                                    </div>

                                    <div className="
                                        text-right
                                    ">

                                        <div className="
                                            text-xl
                                            font-black
                                            text-white
                                        ">
                                            {player.totalTricks}
                                        </div>

                                        <div className="
                                            text-xs
                                            text-slate-400
                                        ">
                                            tricks
                                        </div>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                </div>


                {/* Footer */}

                <div className="
                    border-t
                    border-white/10
                    p-4
                ">

                    <button
                        onClick={() => closeModal}

                        className="
                            w-full
                            h-13
                            rounded-2xl
                            bg-green-500
                            text-black
                            font-black
                            flex
                            items-center
                            justify-center
                            gap-3
                            cursor-pointer
                            hover:scale-[1.01]
                            active:scale-[.98]
                            transition-all
                        "
                    >

                        <Home size={20} />

                        Back To Home

                    </button>

                </div>

            </div>

        </div>

    );
}