import { Player } from "../core/Player.js";
import { Match } from "../domain/match/Match.js";
import { MatchFactory } from "../factories/MatchFactory.js";
import { PlayerManager } from "../managers/PlayerManager.js";

export class MatchLifecycleService {
    static createMatch(players: Player[], totalRounds: number): Match {
        PlayerManager.resetMatchStats(players);
        return MatchFactory.create(players, totalRounds);
    }
}