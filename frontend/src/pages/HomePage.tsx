import {
    useNavigate
} from "react-router-dom";

import {
    createGame
} from "@/api/gameApi";

export default function HomePage() {
    const navigate = useNavigate();
    const create = async () => {
        const result = await createGame();
        navigate(`/game/${result.gameId}`);
    };
    return (
        <div
            className="
                min-h-screen
                flex
                items-center
                justify-center
                bg-slate-900
            "
        >
            <div
                className="
                    bg-white
                    p-12
                    rounded-xl
                    shadow-xl
                "
            >
                <h1
                    className="
                        text-4xl
                        font-bold
                        mb-8
                    "
                >
                    Trump & Twist
                </h1>
                <button
                    onClick={create}
                    className="
                        bg-blue-600
                        text-white
                        px-6
                        py-3
                        rounded
                    "
                >
                    Create Game
                </button>
            </div>
        </div>
    )
}