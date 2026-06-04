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

    const championName = (championId: string) => {
        const champion = snapshot.players.find((p: any) => p.id === championId);
        return champion?.name ?? "-";
    }

    return (
        <div className="bg-green-900 min-h-screen flex justify-center py-3">
            <div className="relative w-[98vw] max-w-425 h-[92vh] rounded-3xl border-4 border-green-500 bg-linear-to-b from-green-700 to-green-800 overflow-hidden">

                {/* Left Panel */}

                <div className="absolute left-2 top-2 z-20">
                    <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 text-white border border-white/10">
                        <div className="text-xs uppercase text-gray-300">
                            Round
                        </div>

                        <div className="text-xl font-bold mb-1">
                            {snapshot.roundNumber}
                        </div>

                        <div className="text-xs uppercase text-gray-300">
                            Trump
                        </div>

                        <div className={`text-2xl font-bold mb-1 ${trumpColor(snapshot)}`}>
                            {snapshot.trumpSuit ? suitMap[snapshot.trumpSuit] : "-"}
                        </div>

                        <div className="text-xs uppercase text-gray-300">
                            Champion
                        </div>

                        <div className="font-bold">
                            {snapshot.champion ? championName(snapshot.champion) : "-"}
                        </div>
                    </div>
                </div>

                {/* Right Panel */}

                <div className="absolute right-2 top-2 z-20">
                    <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 text-white border border-white/10">
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

                <div className="absolute top-3 left-1/2 -translate-x-1/2">
                    <Avatar
                        player={top}
                        active={
                            snapshot.currentPlayerId === "P3"
                        }
                    />
                </div>

                {/* Left */}

                <div className="absolute left-20 top-1/2 -translate-y-1/2">
                    <Avatar
                        player={left}
                        active={
                            snapshot.currentPlayerId === "P2"
                        }
                    />
                </div>

                {/* Right */}

                <div className="absolute right-20 top-1/2 -translate-y-1/2">
                    <Avatar
                        player={right}
                        active={
                            snapshot.currentPlayerId === "P4"
                        }
                    />
                </div>

                {/* Trick Area */}

                <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 w-130 h-80">
                    <div className="absolute inset-0 rounded-full border-4 border-green-400 bg-green-600/20" />

                    {trickCards.map((play: any) => {
                        let style: any = {};

                        switch (play.playerId) {
                            case "P1":
                                style = {
                                    bottom: 20,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                };
                                break;

                            case "P2":
                                style = {
                                    left: 20,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                };
                                break;

                            case "P3":
                                style = {
                                    top: 20,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                };
                                break;

                            case "P4":
                                style = {
                                    right: 20,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                };
                                break;
                        }

                        return (
                            <div
                                key={play.playerId}
                                className="absolute"
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

                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full">
                    <PlayerHand
                        cards={player.hand || []}
                        legalMoves={snapshot.legalMoves}
                        trumpSuit={snapshot.trumpSuit}
                        onPlay={onPlay}
                        disabled={animating}
                    />
                </div>

                {/* Player */}

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                    <Avatar
                        player={player}
                        active={
                            snapshot.currentPlayerId === "P1"
                        }
                    />
                </div>
            </div>
        </div>
    );
}