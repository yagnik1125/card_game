import { Player } from "../core/Player";
import { Match } from "../domain/match/Match";
import { MatchFactory } from "../factories/MatchFactory";
import { PlayerManager } from "../managers/PlayerManager";

export class MatchLifecycleService {
    static createMatch(players: Player[], totalRounds: number): Match {
        PlayerManager.resetMatchStats(players);
        return MatchFactory.create(players, totalRounds);
    }
}