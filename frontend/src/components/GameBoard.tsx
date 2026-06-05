import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

import Avatar from "./Avatar";
import PlayerHand from "./PlayerHand";
import Card from "./Card";
import { suitMap } from "@/utils/constants";

interface Props {
    snapshot: any;
    onPlay: (cardId: string) => void;
}

export default function GameBoard({
    snapshot,
    onPlay,
}: Props) {
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
    );

    const trumpColor = (snapshot: any) => {
        if (snapshot.trumpSuit) {
            if (snapshot.trumpSuit === "HEARTS" || snapshot.trumpSuit === "DIAMONDS") {
                return "text-red-600";
            }
            else {
                return "text-black";
            }
        }
        else {
            return "text-white";
        }
    }

    // const championName = (championId: string) => {
    //     const champion = snapshot.players.find((p: any) => p.id === championId);
    //     return champion?.name ?? "-";
    // }

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
                    <div className="bg-black/30 backdrop-blur-md rounded-2xl px-4 py-3 text-white border border-white/10">
                        <div className="text-xs uppercase text-gray-300">
                            Trump
                        </div>

                        <div className={`text-3xl font-bold ${trumpColor(snapshot)}`}>
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
                    />
                </div>

                {/* Left */}

                <div className="absolute left-[2%] top-1/2 -translate-y-1/2 z-10">
                    <Avatar
                        player={left}
                        champion={snapshot.champion === left.id}
                    />
                </div>

                {/* Right */}

                <div className="absolute right-[2%] top-1/2 -translate-y-1/2 z-10">
                    <Avatar
                        player={right}
                        champion={snapshot.champion === right.id}
                    />
                </div>

                {dealing && (
                    <div className="
                        absolute
                        left-1/2
                        top-1/2
                        -translate-x-1/2
                        -translate-y-1/2
                        z-50
                    ">
                        <div className="
                            w-16
                            h-24
                            bg-red-800
                            rounded-lg
                            border-2
                            border-white
                            shadow-2xl
                        " />
                    </div>
                )}

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

                {/* Player */}

                <div className="absolute bottom-[-1%] left-1/6 -translate-x-1/2 z-10">
                    <Avatar
                        player={player}
                        champion={snapshot.champion === player.id}
                    />
                </div>
            </div>
        </div>
    );
}