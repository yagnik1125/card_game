import { useEffect } from "react";
import confetti from "canvas-confetti";

function hasCanvas2dContext(): boolean {
    try {
        const canvas = document.createElement("canvas");
        return !!canvas.getContext?.("2d");
    } catch {
        return false;
    }
}

export function useWinnerConfetti(active: boolean, isHuman: boolean) {
    useEffect(() => {
        if (!active || !hasCanvas2dContext()) {
            return;
        }

        try {
            const colors = isHuman
                ? ["#fbbf24", "#fde68a", "#ffffff", "#34d399", "#f472b6"]
                : ["#fbbf24", "#f472b6", "#a78bfa", "#60a5fa", "#ffffff", "#34d399"];

            confetti({
                particleCount: 180,
                spread: 110,
                startVelocity: 45,
                origin: { y: 0.6 },
                colors,
                zIndex: 200,
            });

            let rafId = 0;
            const end = Date.now() + 4000;

            const cannons = () => {
                confetti({
                    particleCount: 4,
                    angle: 60,
                    spread: 60,
                    origin: { x: 0, y: 0.75 },
                    colors,
                    zIndex: 200,
                });
                confetti({
                    particleCount: 4,
                    angle: 120,
                    spread: 60,
                    origin: { x: 1, y: 0.75 },
                    colors,
                    zIndex: 200,
                });
                if (Date.now() < end) {
                    rafId = requestAnimationFrame(cannons);
                }
            };

            cannons();

            return () => cancelAnimationFrame(rafId);
        } catch {
            // Environments without a 2D canvas context (e.g. jsdom tests) skip the show.
        }
    }, [active, isHuman]);
}
