import {
    useEffect,
    useState,
} from "react";

import {
    useParams,
} from "react-router-dom";

import {
    getGame,
    playCard,
} from "../api/gameApi";

import PlayerHand from "../components/PlayerHand";

export default function GamePage() {
    const { gameId } =
        useParams();

    const [game, setGame] =
        useState<any>(null);

    const loadGame =
        async () => {
            if (!gameId) return;

            const result =
                await getGame(gameId);

            setGame(result.data);
        };

    useEffect(() => {
        loadGame();
    }, []);

    const handlePlay =
        async (
            cardId: string
        ) => {
            if (!gameId) return;

            await playCard(
                gameId,
                "P1",
                cardId
            );

            await loadGame();
        };

    if (!game) {
        return <div>Loading...</div>;
    }

    const player =
        game.match.players.find(
            (p: any) =>
                p.id === "P1"
        );

    return (
        <div>
            <h2>
                Game:
                {" "}
                {game.gameId}
            </h2>

            <h3>
                Your Hand
            </h3>

            <PlayerHand
                cards={player.hand}
                onPlay={handlePlay}
            />
        </div>
    );
}