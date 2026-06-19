import { GameMode } from "../core/enums.js";
import { Player } from "../core/Player.js";
import { Team } from "../domain/index.js";
import { Match } from "../domain/match/Match.js";
import { MatchFactory } from "../factories/MatchFactory.js";
import { PlayerManager } from "../managers/PlayerManager.js";
import { TeamManager } from "../managers/TeamManager.js";

export class MatchLifecycleService {
    static createMatch(players: Player[], teams: Team[], totalRounds: number, mode: GameMode): Match {
        PlayerManager.resetMatchStats(players);
        if (mode === GameMode.TEAMS_2V2) {
            TeamManager.resetMatchStats(teams);
        }
        return MatchFactory.create(players, totalRounds, mode);
    }
}