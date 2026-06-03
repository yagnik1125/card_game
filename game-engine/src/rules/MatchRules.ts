import { TOTAL_ROUNDS } from "../core/constants";

export class MatchRules {
    static totalRounds(): number {
        return TOTAL_ROUNDS;
    }
    static isMatchCompleted(
        currentRound: number
    ): boolean {
        return currentRound > TOTAL_ROUNDS;
    }
}