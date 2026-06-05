import { Player } from "../core/Player";
import { Match } from "../domain/match/Match";

export class MatchFactory {

    static create(
        players: Player[],
        totalRounds: number,
    ): Match {
        return {
            id: crypto.randomUUID(),
            players,
            rounds: [],
            state: {
                currentRound: 1,
                totalRounds: totalRounds,
                isCompleted: false,
                championPlayerId: null
            },
            result: null,
        };
    }
}