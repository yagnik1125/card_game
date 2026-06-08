import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";

import Avatar from "./Avatar";
import PlayerHand from "./PlayerHand";
import Card from "./Card";
import { suitMap } from "@/utils/constants";
import {
    LogOut
} from "lucide-react";

import {
    useNavigate
} from "react-router-dom";
import { setSnapshot, setWinner, setTrickCards, setAnimating, setDealing } from "@/store/slices/gameSlice";
import { removeGame } from "@/api/gameApi";

interface Props {
    onPlay: (cardId: string) => void;
}

export default function GameBoard({
    onPlay,
}: Props) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const snapshot = useSelector(
        (state: RootState) => state.game.snapshot
    );
    const trickCards = useSelector(
        (state: RootState) => state.game.trickCards
    );
    const animating = useSelector(
        (state: RootState) => state.game.animating
    );
    const player = snapshot.players.find(
        (p: any) => p.id === "P1"
    );
    const left = snapshot.players.find(
        (p: any) => p.id === "P2"
    );
    const top = snapshot.players.find(
        (p: any) => p.id === "P3"
    );
    const right = snapshot.players.find(
        (p: any) => p.id === "P4"
    );
    const dealing = useSelector(
        (state: RootState) => state.game.dealing
    )

    const quitGame = async () => {
        // console.log(snapshot.gameId);
        await removeGame(snapshot.gameId);
        dispatch(setSnapshot(null));
        dispatch(setWinner(null));
        dispatch(setTrickCards([]));
        dispatch(setAnimating(false));
        dispatch(setDealing(false));
        navigate("/");
    };

    return (
        <div className="bg-green-900 min-h-screen flex justify-center py-3">
            <div className="relative w-[98vw] max-w-425 h-[92vh] rounded-3xl border-4 border-green-500 bg-linear-to-b from-green-700 to-green-800 overflow-hidden">

                {/* TopLeft Panel */}

                <div className="absolute left-0 top-0 z-20">
                    <div className="bg-black/30 backdrop-blur-md rounded-2xl px-4 py-3 text-white border border-white/10">
                        <div className="text-xs uppercase text-gray-300">
                            Round
                        </div>

                        <div className="text-2xl font-bold">
                            {snapshot.roundNumber}
                        </div>
                    </div>
                </div>

                {/* TopRight  Panel */}

                <div className="absolute right-0 top-0 z-20">
                    <div className="bg-black/15 backdrop-blur-md rounded-2xl px-4 py-3 text-white border border-white/10">
                        <div className="text-xs uppercase text-gray-300">
                            Trump
                        </div>

                        <div className={`text-3xl font-bold`}>
                            {snapshot.trumpSuit
                                ? suitMap[snapshot.trumpSuit]
                                : "-"
                            }
                        </div>
                    </div>
                </div>

                {/* BottomRight Panel */}

                <div className="absolute right-0 bottom-0 z-20">
                    <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3 text-white border border-white/10">
                        <div className="text-xs uppercase text-gray-300 mb-2">
                            Total Tricks
                        </div>

                        {snapshot.players.map((p: any) => (
                            <div
                                key={p.id}
                                className="flex justify-between gap-5"
                            >
                                <span>
                                    {p.id === "P1"
                                        ? "You"
                                        : p.name}
                                </span>

                                <span className="font-bold">
                                    {p.totalTricks}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top */}

                <div className="absolute top-[0%] left-1/2 -translate-x-1/2 z-10">
                    <Avatar
                        player={top}
                        champion={snapshot.champion === top.id}
                        active={snapshot.currentPlayerId === top.id}
                    />
                </div>

                {/* Left */}

                <div className="absolute left-[2%] top-1/2 -translate-y-1/2 z-10">
                    <Avatar
                        player={left}
                        champion={snapshot.champion === left.id}
                        active={snapshot.currentPlayerId === left.id}
                    />
                </div>

                {/* Right */}

                <div className="absolute right-[2%] top-1/2 -translate-y-1/2 z-10">
                    <Avatar
                        player={right}
                        champion={snapshot.champion === right.id}
                        active={snapshot.currentPlayerId === right.id}
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
                    <div className="
                        w-18
                        h-26
                        rounded-xl
                        border-2
                        border-white
                        shadow-2xl
                        bg-red-900
                        relative
                        overflow-hidden
                    ">
                        <div className="
                            absolute
                            inset-0
                            bg-linear-to-br
                            from-red-700
                            to-red-950
                        "/>
                        <div className="
                            absolute
                            inset-2
                            border
                            border-yellow-300
                            rounded-lg
                        "/>
                    </div>
                </div>

                {/* Trick Area */}

                <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 w-[70%] h-[60%]">
                    <div className="absolute inset-0 rounded-full border-4 border-green-400 bg-green-600/20" />

                    {trickCards.map((play: any) => {
                        let style: any = {};

                        switch (play.playerId) {
                            case "P1":
                                style = {
                                    bottom: "5%",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                };
                                break;
                            case "P2":
                                style = {
                                    left: "25%",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                };
                                break;
                            case "P3":
                                style = {
                                    top: "5%",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                };
                                break;
                            case "P4":
                                style = {
                                    right: "25%",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                };
                                break;
                        }

                        return (
                            <div
                                key={`${play.playerId}-${play.rank}-${play.suit}`}
                                className="absolute scale-[0.85] transition-all duration-500 ease-out"
                                style={style}
                            >
                                <Card
                                    card={{
                                        rank: play.rank,
                                        suit: play.suit,
                                    }}
                                    trumpSuit={snapshot.trumpSuit}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Hand */}

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-fit">
                    <PlayerHand
                        cards={player.hand || []}
                        legalMoves={snapshot.legalMoves}
                        trumpSuit={snapshot.trumpSuit}
                        onPlay={onPlay}
                        disabled={animating}
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
                            bg-black/35
                            backdrop-blur-xl
                            border
                            border-white/10
                            text-white
                            flex
                            items-center
                            gap-3
                            cursor-pointer
                            hover:bg-red-600/80
                            transition-all
                            hover:scale-105
                            active:scale-95
                            shadow-xl
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