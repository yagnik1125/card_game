import { useNavigate } from "react-router-dom";
import { createGame } from "../api/gameApi";

export default function HomePage() {
    const navigate = useNavigate();

    const handleCreateGame =
        async () => {
            const result =
                await createGame();

            navigate(
                `/game/${result.gameId}`
            );
        };

    return (
        <div>
            <h1>
                Trump & Twist
            </h1>

            <button
                onClick={
                    handleCreateGame
                }
            >
                Create Game
            </button>
        </div>
    );
}