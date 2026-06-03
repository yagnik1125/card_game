import { Player } from "../core/Player";
import { MatchFactory } from "../factories/MatchFactory";
import { PlayerManager } from "../managers/PlayerManager";

export class MatchLifecycleService {
    static createMatch(players: Player[]) {
        PlayerManager.resetMatchStats(players);
        return MatchFactory.create(players);
    }
}