import type { CSSProperties } from "react";
import Avatar from "@/components/solo/Avatar";
import Card from "@/components/common/Card";
import { BotCards } from "@/components/common/BotCards";
import { HUMAN_PLAYER_ID, suitMap } from "@/utils/constants";
import {
    LogOut,
    Trophy,
} from "lucide-react";
import {
    selectAnimating,
    selectDealing,
    selectIsHumanTurn,
    selectPlayableCardIds,
    selectSnapshot,
    selectTrickCards,
    selectTrickCollect,
} from "@/ws/store/selectors";
import { useSelector } from "react-redux";
import WsPlayerHand from "../common/WsPlayerHand";

interface Props {
    onPlay: (cardId: string) => void;
    onQuit: () => void;
    /** Disables the hand during a reconnect so no cards can be played mid-resync. */
    handDisabled?: boolean;
}

export default function WsGameBoard({
    onPlay,
    onQuit,
    handDisabled = false,
}: Props) {
    const snapshot = useSelector(selectSnapshot) ?? null;
    const trickCards = useSelector(selectTrickCards);
    const animating = useSelector(selectAnimating);
    const dealing = useSelector(selectDealing);
    const isHumanTurn = useSelector(selectIsHumanTurn);
    const playableCardIds = useSelector(selectPlayableCardIds);
    const trickCollect = useSelector(selectTrickCollect);
    if (!snapshot) {
        return null;
    }
    const player = snapshot.players.find(
        (p) => p.id === HUMAN_PLAYER_ID
    )!;
    const left = snapshot.players.find(
        (p) => p.id === "P2"
    )!;
    const top = snapshot.players.find(
        (p) => p.id === "P3"
    )!;
    const right = snapshot.players.find(
        (p) => p.id === "P4"
    )!;

    const quitGame = () => {
        onQuit();
    };

    return (
        <div className="bg-[#04260f] min-h-screen flex justify-center py-3">
            <div className="relative w-[98vw] max-w-425 h-[96vh] rounded-3xl border-[6px] border-amber-200/25 bg-[#0b5227] shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden">
                <div
                    className="
                        absolute
                        inset-2
                        rounded-[22px]
                        border
                        border-amber-100/15
                        pointer-events-none
                    "
                />
                {/* Decorative corner suits */}
                <div className="absolute top-3 left-4 text-lg text-amber-100/15 pointer-events-none select-none">♠</div>
                <div className="absolute top-3 right-4 text-lg text-amber-100/15 pointer-events-none select-none">♥</div>
                <div className="absolute bottom-3 left-4 text-lg text-amber-100/15 pointer-events-none select-none">♦</div>
                <div className="absolute bottom-3 right-4 text-lg text-amber-100/15 pointer-events-none select-none">♣</div>
                {/* Table Lighting */}
                <div className="
                    absolute
                    inset-0
                    pointer-events-none
                    rounded-3xl
                    table-felt
                ">
                    <div className="absolute inset-0 bg-linear-to-b from-white/5 via-transparent to-black/40" />
                    <div className="
                        absolute
                        left-1/2
                        top-1/2
                        -translate-x-1/2
                        -translate-y-1/2
                        w-[120%]
                        h-[120%]
                        rounded-full
                        bg-white/5
                        blur-3xl
                    "/>
                    <div className="
                        absolute
                        inset-0
                        bg-radial
                        from-transparent
                        via-transparent
                        to-black/50
                    "/>
                </div>

                {/* TopLeft Panel */}

                <div className="absolute left-0 top-0 z-20">
                    <div
                        className="
                            min-w-22
                            px-5
                            py-4
                            rounded-3xl
                            bg-black/40
                            backdrop-blur-xl
                            border
                            border-amber-200/20
                            shadow-2xl
                            shadow-black/40
                            text-white
                        "
                    >
                        <div className="
                            flex
                            items-center
                            gap-1.5
                            mb-1.5
                        ">
                            <span className="
                                inline-block
                                w-1.5
                                h-1.5
                                rotate-45
                                bg-amber-300/80
                            " />
                            <div className="
                                text-[10px]
                                uppercase
                                tracking-[0.25em]
                                text-amber-200/70
                            ">
                                Round
                            </div>
                        </div>

                        <div className="
                            text-4xl
                            font-black
                            font-display
                            leading-none
                            text-amber-50
                            drop-shadow-[0_0_10px_rgba(251,191,36,0.25)]
                        ">
                            {snapshot.roundNumber}
                        </div>
                    </div>
                </div>

                {/* TopRight  Panel */}

                <div className="absolute right-0 top-0 z-20">
                    <div
                        className="
                            min-w-22
                            px-5
                            py-4
                            rounded-3xl
                            bg-black/40
                            backdrop-blur-xl
                            border
                            border-amber-200/20
                            shadow-2xl
                            shadow-amber-500/10
                            text-white
                            text-center
                        "
                    >
                        <div className="
                            text-[10px]
                            uppercase
                            tracking-[0.25em]
                            text-amber-200/70
                            mb-1.5
                        ">
                            Trump Suit
                        </div>

                        <div className="
                            flex
                            items-center
                            justify-center
                        ">
                            <span className="
                                w-13
                                h-13
                                rounded-full
                                bg-amber-400/15
                                border
                                border-amber-300/30
                                flex
                                items-center
                                justify-center
                                text-4xl
                                leading-none
                                shadow-[0_0_18px_rgba(251,191,36,0.25)]
                            ">
                                {snapshot.trumpSuit
                                    ? suitMap[snapshot.trumpSuit]
                                    : "?"
                                }
                            </span>
                        </div>
                    </div>
                </div>

                {/* BottomRight Panel */}

                <div className="absolute right-0 bottom-0 z-20">
                    <div
                        className="
                            w-fit
                            rounded-3xl
                            bg-black/40
                            backdrop-blur-xl
                            border
                            border-amber-200/20
                            shadow-2xl
                            shadow-black/40
                            overflow-hidden
                        "
                    >
                        <div
                            className="
                                px-3
                                py-2
                                border-b
                                border-white/10
                                text-white
                                flex
                                items-center
                                gap-2
                            "
                        >
                            <Trophy size={12} className="text-amber-300" />
                            <div className="
                                text-[10px]
                                uppercase
                                tracking-[0.25em]
                                text-amber-200/70
                            ">
                                Total Tricks
                            </div>
                        </div>

                        <div className="p-1">
                            {snapshot.players.map((p) => (
                                <div
                                    key={p.id}
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        py-px
                                        px-px
                                        rounded-xl
                                        text-white
                                        hover:bg-white/5
                                        transition-colors
                                    "
                                >
                                    <div className="
                                        flex
                                        items-center
                                        gap-1
                                    ">
                                        <div
                                            className={`
                                                w-2
                                                h-2
                                                rounded-full
                                                ${p.id === HUMAN_PLAYER_ID
                                                    ? "bg-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                                                    : "bg-white/40"
                                                }
                                            `}
                                        />

                                        <span
                                            className={
                                                p.id === HUMAN_PLAYER_ID
                                                    ? "font-bold"
                                                    : ""
                                            }
                                        >
                                            {p.id === HUMAN_PLAYER_ID
                                                ? "You"
                                                : p.name}
                                        </span>
                                    </div>

                                    <div
                                        className={`
                                            min-w-8
                                            text-center
                                            rounded-lg
                                            font-black
                                            ${p.id === HUMAN_PLAYER_ID
                                                ? "bg-linear-to-br from-amber-300 to-yellow-500 text-black shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                                                : "bg-white/10 text-white"
                                            }
                                        `}
                                    >
                                        {p.totalTricks}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top */}

                <div className="absolute top-[0%] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
                    <BotCards
                        count={top.cardsRemaining}
                        dealing={dealing}
                        seat="top"
                    />
                    <Avatar
                        player={top}
                        champion={snapshot.champion === top.id}
                        active={snapshot.currentPlayerId === top.id}
                    />
                </div>

                {/* Left */}

                <div className="absolute left-[2%] top-1/2 -translate-y-1/2 z-10 flex items-center gap-3">
                    <BotCards
                        count={left.cardsRemaining}
                        vertical
                        dealing={dealing}
                        seat="left"
                    />
                    <Avatar
                        player={left}
                        champion={snapshot.champion === left.id}
                        active={snapshot.currentPlayerId === left.id}
                    />
                </div>

                {/* Right */}

                <div className="absolute right-[2%] top-1/2 -translate-y-1/2 z-10 flex items-center gap-3">
                    <Avatar
                        player={right}
                        champion={snapshot.champion === right.id}
                        active={snapshot.currentPlayerId === right.id}
                    />
                    <BotCards
                        count={right.cardsRemaining}
                        vertical
                        dealing={dealing}
                        seat="right"
                    />
                </div>

                {/* Center Deck Shown after round completion */}

                <div className={`
                    absolute
                    left-1/2
                    top-1/2
                    -translate-x-1/2
                    -translate-y-1/2
                    z-50
                    transition-all
                    duration-500
                    ${dealing
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-75 pointer-events-none"}
                    `}
                >
                    {dealing && (
                        <div className="
                            absolute
                            -inset-4
                            rounded-3xl
                            bg-amber-300/20
                            blur-2xl
                            animate-deck-halo
                        " />
                    )}
                    <div className="
                        w-18
                        h-26
                        rounded-xl
                        border-2
                        border-amber-200/80
                        shadow-2xl
                        shadow-black/50
                        bg-red-900
                        relative
                        overflow-hidden
                        animate-deck-float
                    ">
                        <div className="
                            absolute
                            inset-0
                            bg-linear-to-br
                            from-red-600
                            via-red-800
                            to-red-950
                        "/>
                        <div className="
                            absolute
                            inset-1
                            border
                            border-amber-300/70
                            rounded-lg
                        "/>
                        <div className="
                            absolute
                            inset-2.5
                            border
                            border-red-300/20
                            rounded
                        "/>
                        <div className="
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                            text-xl
                            text-amber-200/60
                        ">
                            ◆
                        </div>
                    </div>
                    {dealing && (
                        <div className="
                            mt-2
                            text-center
                            text-[10px]
                            uppercase
                            tracking-[0.3em]
                            text-amber-200/80
                            font-semibold
                        ">
                            Dealing
                        </div>
                    )}
                </div>

                {/* Trick Area */}

                <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%]">
                    <div className="
                        absolute
                        inset-0
                        rounded-full
                        border-2
                        border-amber-200/25
                        bg-black/15
                        backdrop-blur-sm
                        shadow-inner
                        shadow-black/60
                    " />
                    <div className="
                        absolute
                        inset-2
                        rounded-full
                        border
                        border-amber-100/10
                    " />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full bg-white/5 blur-3xl" />
                    {trickCards.map((play) => {
                        let style: CSSProperties = {};
                        let animationClass = "";

                        switch (play.playerId) {
                            case HUMAN_PLAYER_ID:
                                style = { left: "50%", top: "82%" };
                                animationClass = "animate-card-play-bottom";
                                break;
                            case "P2":
                                style = { left: "42%", top: "50%" };
                                animationClass = "animate-card-play-left";
                                break;
                            case "P3":
                                style = { left: "50%", top: "17%" };
                                animationClass = "animate-card-play-top";
                                break;
                            case "P4":
                                style = { left: "58%", top: "50%" };
                                animationClass = "animate-card-play-right";
                                break;
                        }

                        const collecting = trickCollect !== null;

                        return (
                            <div
                                key={`${play.playerId}-${play.rank}-${play.suit}`}
                                className={`absolute ${collecting ? `animate-card-collect-${trickCollect}` : animationClass}`}
                                style={{
                                    ...style,
                                    transform: "translate(-50%, -50%)",
                                }}
                            >
                                <Card
                                    card={{
                                        rank: play.rank,
                                        suit: play.suit,
                                    }}
                                    trumpSuit={snapshot.trumpSuit ?? ""}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Hand */}

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-fit">
                    <WsPlayerHand
                        cards={player.hand || []}
                        legalMoves={playableCardIds}
                        trumpSuit={snapshot.trumpSuit ?? ""}
                        onPlay={onPlay}
                        disabled={!isHumanTurn || animating || handDisabled}
                    />
                </div>

                {/* Quit Button */}

                <div className="
                    absolute
                    left-4
                    bottom-4
                    z-30
                ">
                    <button
                        onClick={quitGame}
                        className="
                            h-14
                            px-5
                            rounded-2xl
                            bg-black/40
                            backdrop-blur-xl
                            border
                            border-amber-200/20
                            text-white
                            flex
                            items-center
                            gap-3
                            cursor-pointer
                            hover:bg-red-600/90
                            hover:border-red-400/50
                            transition-all
                            hover:scale-105
                            active:scale-95
                            shadow-xl
                            shadow-black/40
                        "
                    >
                        <LogOut size={20} />
                        <span className="
                            font-bold
                            hidden
                            sm:block
                        ">
                            Quit
                        </span>
                    </button>
                </div>

                {/* Player */}

                <div className="absolute bottom-[-1%] left-1/6 -translate-x-1/2 z-10">
                    <Avatar
                        player={player}
                        champion={snapshot.champion === player.id}
                        active={snapshot.currentPlayerId === player.id}
                    />
                </div>
            </div>
        </div>
    );
}