import { GameMode } from "../core/enums.js";
import { Player } from "../core/Player.js";
import { Match } from "../domain/match/Match.js";
import { TeamFactory } from "./TeamFactory.js";

export class MatchFactory {

    static create(
        players: Player[],
        totalRounds: number,
        mode: GameMode
    ): Match {
        return {
            id: crypto.randomUUID(),
            players,
            teams: mode === GameMode.TEAMS_2V2 ? TeamFactory.createDefaultTeams(players) : [],
            mode: mode,
            rounds: [],
            state: {
                currentRound: 1,
                totalRounds: totalRounds,
                isCompleted: false,
                championPlayerId: undefined,
                championTeamId: undefined
            },
            result: null,
        };
    }
}