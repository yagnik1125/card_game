import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    createGame,
    health,
} from "@/api/gameApi";
import { extractErrorMessage } from "@/utils/errors";
import GameLoader from "@/components/common/GameLoader";
import {
    Swords,
    Users,
    Check,
    Play,
    Loader2,
    Sparkles,
    WifiOff,
    BookOpen,
} from "lucide-react";
import RuleBook from "@/components/common/RuleBook";

type Difficulty = | "easy" | "medium" | "hard";
type GameMode = | "SOLO" | "TEAMS_2V2";

const FLOATING_SUITS = [
    { suit: "♠", left: "6%", size: "text-5xl", duration: "18s", delay: "0s" },
    { suit: "♥", left: "18%", size: "text-7xl", duration: "24s", delay: "4s" },
    { suit: "♣", left: "32%", size: "text-4xl", duration: "20s", delay: "8s" },
    { suit: "♦", left: "48%", size: "text-6xl", duration: "26s", delay: "2s" },
    { suit: "♠", left: "62%", size: "text-4xl", duration: "22s", delay: "10s" },
    { suit: "♥", left: "76%", size: "text-6xl", duration: "19s", delay: "6s" },
    { suit: "♣", left: "88%", size: "text-5xl", duration: "25s", delay: "1s" },
    { suit: "♦", left: "26%", size: "text-3xl", duration: "28s", delay: "12s" },
    { suit: "♥", left: "56%", size: "text-3xl", duration: "23s", delay: "14s" },
];

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
    easy: "bg-emerald-500 text-black scale-105 shadow-[0_0_20px_rgba(16,185,129,0.45)] border-emerald-300",
    medium: "bg-amber-500 text-black scale-105 shadow-[0_0_20px_rgba(245,158,11,0.45)] border-amber-300",
    hard: "bg-rose-500 text-black scale-105 shadow-[0_0_20px_rgba(244,63,94,0.45)] border-rose-300",
};

const MODE_STYLES: Record<GameMode, string> = {
    SOLO: "bg-purple-600/25 border-purple-400/70 text-white scale-[1.03] shadow-[0_0_26px_rgba(168,85,247,0.35)]",
    TEAMS_2V2: "bg-emerald-600/25 border-emerald-400/70 text-white scale-[1.03] shadow-[0_0_26px_rgba(16,185,129,0.35)]",
};

export default function HomePage() {
    const navigate = useNavigate();
    const [rounds, setRounds] = useState(3);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<GameMode>("SOLO");
    const [difficulty, setDifficulty] = useState<Difficulty>("medium");
    const [creating, setCreating] = useState(false);
    const [healthy, setHealthy] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const [showRules, setShowRules] = useState(false);

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const create = async () => {
        if (!healthy || creating) {
            return;
        }
        try {
            setCreating(true);
            setCreateError(null);
            const result = await createGame(rounds, difficulty, mode);
            await wait(1000);
            if (mode === "SOLO") {
                navigate(`/game/${result.gameId}`);
            }
            else {
                navigate(`/game/team2v2/${result.gameId}`);
            }
        }
        catch (error) {
            setCreateError(extractErrorMessage(error, "Failed to create game. Please try again."));
        }
        finally {
            setCreating(false);
        }
    };

    const runHealthCheck = () => {
        health()
            .then(() => setHealthy(true))
            .catch((error) => {
                setHealthy(false);
                setConnectionError(extractErrorMessage(error, "Cannot reach server"));
            })
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        runHealthCheck();
    }, []);

    if (loading) {
        return <GameLoader />;
    }

    if (connectionError) {
        return (
            <div className="
                min-h-screen
                bg-[#080d1a]
                font-body
                flex
                flex-col
                items-center
                justify-center
                gap-6
                text-white
                px-4
                relative
                overflow-hidden
            ">
                <div className="
                    absolute
                    -top-24
                    -left-24
                    w-96
                    h-96
                    rounded-full
                    bg-rose-600/15
                    blur-3xl
                    pointer-events-none
                " />
                <div className="
                    absolute
                    -bottom-24
                    -right-24
                    w-96
                    h-96
                    rounded-full
                    bg-purple-600/15
                    blur-3xl
                    pointer-events-none
                " />
                <div className="
                    relative
                    w-20
                    h-20
                    rounded-full
                    bg-rose-500/10
                    border
                    border-rose-400/30
                    flex
                    items-center
                    justify-center
                    animate-trophy-pulse
                ">
                    <WifiOff size={36} className="text-rose-400" />
                </div>
                <div className="
                    text-3xl
                    font-display
                    font-bold
                    text-center
                ">
                    Cannot reach server
                </div>
                <div className="
                    text-white/60
                    text-center
                    max-w-sm
                ">
                    {connectionError}
                    {" "}
                    Check that the backend is running.
                </div>
                <button
                    onClick={() => {
                        setLoading(true);
                        setConnectionError(null);
                        runHealthCheck();
                    }}
                    className="
                        px-8
                        py-3
                        rounded-xl
                        bg-green-600
                        hover:bg-green-500
                        font-semibold
                        cursor-pointer
                        transition-all
                        hover:scale-105
                        active:scale-95
                    "
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="
            min-h-screen
            relative
            overflow-hidden
            bg-[#080d1a]
            font-body
        ">
            {/* Ambient glows */}
            <div className="
                absolute
                -top-32
                -left-32
                w-96
                h-96
                rounded-full
                bg-purple-600/20
                blur-3xl
                pointer-events-none
            " />
            <div className="
                absolute
                -bottom-32
                -right-32
                w-96
                h-96
                rounded-full
                bg-emerald-600/20
                blur-3xl
                pointer-events-none
            " />
            <div className="
                absolute
                top-1/3
                left-1/2
                -translate-x-1/2
                w-[520px]
                h-[520px]
                rounded-full
                bg-amber-500/10
                blur-3xl
                pointer-events-none
            " />

            {/* Floating suits */}
            {FLOATING_SUITS.map((item, index) => (
                <div
                    key={index}
                    aria-hidden
                    className={`
                        absolute
                        -top-10
                        pointer-events-none
                        select-none
                        ${item.suit === "♥" || item.suit === "♦"
                            ? "text-red-500/25"
                            : "text-slate-400/20"
                        }
                        ${item.size}
                    `}
                    style={{
                        left: item.left,
                        animation: `floatSuit ${item.duration} linear ${item.delay} infinite`,
                    }}
                >
                    {item.suit}
                </div>
            ))}

            <div className="
                relative
                flex
                items-center
                justify-center
                min-h-screen
                px-4
                py-10
            ">
                <div className="
                    w-full
                    max-w-xl
                    animate-fade-up
                ">

                    {/* Header */}
                    <header className="text-center mb-9">
                        <div className="
                            flex
                            justify-center
                            gap-4
                            mb-6
                            text-5xl
                        ">
                            <span
                                className="text-slate-300 animate-suit-bounce inline-block"
                                style={{ animationDelay: "0s" }}
                            >
                                ♠
                            </span>
                            <span
                                className="text-red-500 animate-suit-bounce inline-block"
                                style={{ animationDelay: "0.4s" }}
                            >
                                ♥
                            </span>
                            <span
                                className="text-slate-300 animate-suit-bounce inline-block"
                                style={{ animationDelay: "0.8s" }}
                            >
                                ♣
                            </span>
                            <span
                                className="text-red-500 animate-suit-bounce inline-block"
                                style={{ animationDelay: "1.2s" }}
                            >
                                ♦
                            </span>
                        </div>

                        <h1 className="
                            text-5xl
                            sm:text-6xl
                            font-display
                            font-black
                            tracking-wide
                            bg-gradient-to-r
                            from-amber-200
                            via-yellow-400
                            to-amber-500
                            bg-clip-text
                            text-transparent
                            animate-title-glow
                        ">
                            Trump & Twist
                        </h1>

                        <p className="
                            mt-4
                            text-slate-400
                            flex
                            items-center
                            justify-center
                            gap-2
                        ">
                            <Sparkles size={15} className="text-amber-400" />
                            Challenge bots. Win tricks. Become champion.
                        </p>
                    </header>

                    {/* Card shell */}
                    <div className="
                        relative
                        rounded-3xl
                        p-[2px]
                        overflow-hidden
                    ">
                        <div className="
                            absolute
                            -inset-[150%]
                            animate-spin-slow
                            bg-[conic-gradient(from_0deg,#a855f7_0%,#f59e0b_18%,transparent_45%,transparent_55%,#10b981_82%,#a855f7_100%)]
                        " />
                        <div className="
                            relative
                            rounded-[22px]
                            bg-slate-950/90
                            backdrop-blur-xl
                            px-6
                            py-8
                            sm:px-9
                            sm:py-10
                            flex
                            flex-col
                            gap-8
                        ">

                            {/* GAME MODE */}
                            <section
                                className="animate-fade-up"
                                style={{ animationDelay: "0.15s" }}
                            >
                                <div className="
                                    text-white/50
                                    font-semibold
                                    uppercase
                                    tracking-[0.25em]
                                    text-[11px]
                                    mb-4
                                ">
                                    Game Mode
                                </div>
                                <div className="
                                    grid
                                    grid-cols-2
                                    gap-3
                                ">
                                    <button
                                        onClick={() => setMode("SOLO")}
                                        className={`
                                            relative
                                            h-20
                                            rounded-2xl
                                            border
                                            font-bold
                                            cursor-pointer
                                            transition-all
                                            duration-300
                                            flex
                                            items-center
                                            justify-center
                                            gap-2.5
                                            ${mode === "SOLO"
                                                ? MODE_STYLES.SOLO
                                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                                            }
                                        `}
                                    >
                                        {mode === "SOLO" && (
                                            <span className="
                                                absolute
                                                top-2
                                                right-2
                                                w-5
                                                h-5
                                                rounded-full
                                                bg-purple-400
                                                flex
                                                items-center
                                                justify-center
                                            ">
                                                <Check size={12} className="text-black" />
                                            </span>
                                        )}
                                        <Swords
                                            size={20}
                                            className={mode === "SOLO"
                                                ? "text-purple-300"
                                                : "text-white/50"
                                            }
                                        />
                                        Solo
                                    </button>

                                    <button
                                        onClick={() => setMode("TEAMS_2V2")}
                                        className={`
                                            relative
                                            h-20
                                            rounded-2xl
                                            border
                                            font-bold
                                            cursor-pointer
                                            transition-all
                                            duration-300
                                            flex
                                            items-center
                                            justify-center
                                            gap-2.5
                                            ${mode === "TEAMS_2V2"
                                                ? MODE_STYLES.TEAMS_2V2
                                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                                            }
                                        `}
                                    >
                                        {mode === "TEAMS_2V2" && (
                                            <span className="
                                                absolute
                                                top-2
                                                right-2
                                                w-5
                                                h-5
                                                rounded-full
                                                bg-emerald-400
                                                flex
                                                items-center
                                                justify-center
                                            ">
                                                <Check size={12} className="text-black" />
                                            </span>
                                        )}
                                        <Users
                                            size={20}
                                            className={mode === "TEAMS_2V2"
                                                ? "text-emerald-300"
                                                : "text-white/50"
                                            }
                                        />
                                        Teams 2v2
                                    </button>
                                </div>
                            </section>

                            {/* ROUND SELECT */}
                            <section
                                className="animate-fade-up"
                                style={{ animationDelay: "0.25s" }}
                            >
                                <div className="
                                    text-white/50
                                    font-semibold
                                    uppercase
                                    tracking-[0.25em]
                                    text-[11px]
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
                                                    rounded-full
                                                    font-bold
                                                    cursor-pointer
                                                    transition-all
                                                    duration-300
                                                    border
                                                    ${rounds === round
                                                        ? `bg-gradient-to-b from-emerald-400 to-green-600 text-black scale-110 border-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.45)]`
                                                        : `bg-white/5 border-white/10 text-white/70 hover:bg-white/10`
                                                    }
                                                `}
                                            >
                                                {round}
                                            </button>
                                        )
                                    )}
                                </div>
                            </section>

                            {/* DIFFICULTY SELECT */}
                            <section
                                className="animate-fade-up"
                                style={{ animationDelay: "0.35s" }}
                            >
                                <div className="
                                    text-white/50
                                    font-semibold
                                    uppercase
                                    tracking-[0.25em]
                                    text-[11px]
                                    mb-4
                                ">
                                    Bot Difficulty
                                </div>
                                <div className="
                                    grid
                                    grid-cols-3
                                    gap-3
                                ">
                                    {(["easy", "medium", "hard"] as Difficulty[]).map(
                                        level => (
                                            <button
                                                key={level}
                                                onClick={() =>
                                                    setDifficulty(level)
                                                }
                                                className={`
                                                    h-12
                                                    rounded-xl
                                                    font-bold
                                                    capitalize
                                                    cursor-pointer
                                                    border
                                                    transition-all
                                                    duration-300
                                                    ${difficulty === level
                                                        ? DIFFICULTY_STYLES[level]
                                                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                                                    }
                                                `}
                                            >
                                                {level}
                                            </button>
                                        )
                                    )}
                                </div>
                            </section>

                            {/* CREATE ERROR */}
                            {createError && (
                                <div className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-2
                                    rounded-xl
                                    border
                                    border-rose-500/30
                                    bg-rose-500/10
                                    px-4
                                    py-3
                                    text-sm
                                    text-rose-300
                                    animate-fade-up
                                ">
                                    <span>{createError}</span>
                                    <button
                                        onClick={() => setCreateError(null)}
                                        className="cursor-pointer font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* PLAY */}
                            <button
                                onClick={create}
                                disabled={!healthy || creating}
                                className="
                                    relative
                                    w-full
                                    h-14
                                    rounded-2xl
                                    bg-gradient-to-r
                                    from-emerald-500
                                    via-green-500
                                    to-emerald-500
                                    font-black
                                    text-black
                                    flex
                                    items-center
                                    justify-center
                                    gap-3
                                    cursor-pointer
                                    disabled:opacity-50
                                    disabled:cursor-not-allowed
                                    hover:scale-[1.02]
                                    active:scale-[0.99]
                                    transition-all
                                    overflow-hidden
                                "
                            >
                                <div className="
                                    absolute
                                    inset-y-0
                                    w-1/3
                                    bg-white/40
                                    blur-md
                                    pointer-events-none
                                    animate-shine-sweep
                                " />
                                {creating
                                    ? <Loader2 size={20} className="animate-spin" />
                                    : <Play size={20} fill="currentColor" />
                                }
                                Play {rounds} Round{rounds > 1 ? "s" : ""}
                            </button>

                            {/* RULES */}
                            <button
                                onClick={() => setShowRules(true)}
                                className="
                                    w-full
                                    h-12
                                    rounded-2xl
                                    border
                                    border-white/15
                                    bg-white/5
                                    text-white/80
                                    font-bold
                                    flex
                                    items-center
                                    justify-center
                                    gap-2.5
                                    cursor-pointer
                                    hover:bg-white/10
                                    hover:text-white
                                    hover:border-amber-400/40
                                    transition-all
                                    duration-300
                                    animate-fade-up
                                "
                                style={{ animationDelay: "0.45s" }}
                            >
                                <BookOpen
                                    size={18}
                                    className="text-amber-400"
                                />
                                How to Play
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showRules && (
                <RuleBook onClose={() => setShowRules(false)} />
            )}
        </div>
    )
}
