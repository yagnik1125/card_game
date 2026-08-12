import type { ViewPlayer } from "@/types/game";

export function selectSoloMatchWinner(
    players: ViewPlayer[]
): ViewPlayer | undefined {
    if (players.length === 0) {
        return undefined;
    }
    return [...players].sort((a, b) => {
        const aRounds = a.roundsWon ?? 0;
        const bRounds = b.roundsWon ?? 0;
        if (aRounds !== bRounds) {
            return bRounds - aRounds;
        }
        return b.totalTricks - a.totalTricks;
    })[0];
}
