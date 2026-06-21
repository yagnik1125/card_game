import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { createGame, health } from "@/api/gameApi";
import GameLoader from "@/components/common/GameLoader";

type Difficulty = | "easy" | "medium" | "hard";
type GameMode = | "SOLO" | "TEAMS_2V2";

export default function HomePage() {
    const navigate = useNavigate();
    const [rounds, setRounds] = useState(3);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<GameMode>("SOLO");
    const [difficulty, setDifficulty] = useState<Difficulty>("medium");
    const [creating, setCreating] = useState(false);

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const create = async () => {
        try {
            setCreating(true);
            const result = await createGame(rounds, difficulty, mode);
            await wait(1000);
            if (mode === "SOLO") {
                navigate(`/game/${result.gameId}`);
            }
            else {
                navigate(`/game/team2v2/${result.gameId}`);
            }
        }
        finally {
            setCreating(false);
        }
    };

    const load = async () => {
        setLoading(true);
        await health();
        setLoading(false);
    }

    useEffect(() => {
        load();
    }, []);

    if (creating || loading) {
        return <GameLoader />;
    }

    return (
        <div className="
            min-h-screen
            bg-linear-to-br
            from-slate-950
            via-slate-900
            to-green-950
            flex
            items-center
            justify-center
            px-4
        ">
            <div className="
                w-full
                max-w-xl
                rounded-3xl
                border
                border-white/10
                bg-white/5
                backdrop-blur-xl
                p-10
                shadow-2xl
            ">

                {/* Header */}

                <div className="
                    text-center
                    mb-10
                ">
                    <div className="
                        text-7xl
                        mb-4
                    ">
                        ♠️ ♥️ ♣️ ♦️
                    </div>
                    <h1 className="
                        text-5xl
                        font-black
                        text-white
                    ">
                        Trump & Twist
                    </h1>
                    <p className="
                        mt-3
                        text-slate-400
                    ">
                        Challenge bots.
                        Win tricks.
                        Become champion.
                    </p>
                </div>

                {/* GAME MODE */}

                <div className="mb-10">
                    <div
                        className="
                            text-white
                            font-semibold
                            mb-4
                        "
                    >
                        Game Mode
                    </div>

                    <div
                        className="
                            grid
                            grid-cols-2
                            gap-3
                        "
                    >
                        <button
                            onClick={() => setMode("SOLO")}
                            className={`
                                h-14
                                rounded-xl
                                font-bold
                                cursor-pointer
                                transition-all
                                ${mode === "SOLO"
                                    ? "bg-purple-500 text-white scale-105"
                                    : "bg-white/10 text-white hover:bg-white/20"
                                }
                            `}
                        >
                            Solo
                        </button>

                        <button
                            onClick={() => setMode("TEAMS_2V2")}
                            className={`
                                h-14
                                rounded-xl
                                font-bold
                                cursor-pointer
                                transition-all
                                ${mode === "TEAMS_2V2"
                                    ? "bg-green-500 text-black scale-105"
                                    : "bg-white/10 text-white hover:bg-white/20"
                                }
                            `}
                        >
                            Teams 2v2
                        </button>
                    </div>
                </div>

                {/* ROUND SELECT */}

                <div className="mb-10">
                    <div className="
                        text-white
                        font-semibold
                        mb-4
                    ">
                        Number Of Rounds
                    </div>
                    <div className="
                        grid
                        grid-cols-5
                        gap-3
                    ">
                        {[1, 2, 3, 4, 5].map(
                            round => (
                                <button
                                    key={round}
                                    onClick={() => setRounds(round)}
                                    className={`
                                        h-14
                                        rounded-xl
                                        font-bold
                                        cursor-pointer
                                        transition-all
                                        ${rounds === round
                                            ? `bg-green-500 text-black scale-105 shadow-lg`
                                            : `bg-white/10 text-white hover:bg-white/20`
                                        }
                                    `}
                                >
                                    {round}
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* DIFFICULTY SELECT */}

                <div className="mb-10">
                    <div className="
                        text-white
                        font-semibold
                        mb-4
                    ">
                        Bot Difficulty
                    </div>
                    <div className="
                        grid
                        grid-cols-3
                        gap-3
                    ">
                        {["easy", "medium", "hard"].map(
                            level => (
                                <button
                                    key={level}
                                    onClick={() =>
                                        setDifficulty(level as Difficulty)
                                    }
                                    className={`
                                        h-14
                                        rounded-xl
                                        font-bold
                                        capitalize
                                        cursor-pointer
                                        transition-all
                                        ${difficulty === level
                                            ? level === "easy"
                                                ? `bg-blue-500 text-white scale-105`
                                                : level === "medium"
                                                    ? `bg-yellow-500 text-black scale-105`
                                                    : `bg-red-500 text-white scale-105`
                                            : `bg-white/10 text-white hover:bg-white/20`
                                        }
                                    `}
                                >
                                    {level}
                                </button>
                            )
                        )}
                    </div>
                </div>
                {/* PLAY BUTTON */}
                <button
                    disabled={creating}
                    onClick={create}
                    className="
                        w-full
                        h-16
                        rounded-2xl
                        bg-green-500
                        text-black
                        text-xl
                        font-black
                        cursor-pointer
                        transition-all
                        hover:scale-[1.02]
                        active:scale-[.98]
                        disabled:opacity-50
                    "
                >
                    {`Play ${rounds} Round ${difficulty}  ${mode === "SOLO"
                        ? "Solo"
                        : "Teams 2v2"
                        } Game`}
                </button>
            </div>
        </div>
    );
}