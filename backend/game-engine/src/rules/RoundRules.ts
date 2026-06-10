import { TOTAL_CARDS_PER_PLAYER } from "../core/constants.js";

export class RoundRules {
    static totalTricks(): number {
        return TOTAL_CARDS_PER_PLAYER;
    }
    static isRoundCompleted(
        playedTricks: number
    ): boolean {
        return playedTricks >= TOTAL_CARDS_PER_PLAYER;
    }
}