import { Player } from "../core/Player.js";
import { DeckManager } from "../managers/DeckManager.js";
import { PlayerManager } from "../managers/PlayerManager.js";
import { RoundFactory } from "../factories/RoundFactory.js";
import { TrickFactory } from "../factories/TrickFactory.js";
import { Round } from "../domain/round/Round.js";
import { Trick } from "../domain/trick/Trick.js";
import { TeamManager } from "../managers/TeamManager.js";
import { Team } from "../domain/team/Team.js";

export class RoundLifecycleService {
    static startRound(
        players: Player[],
        teams: Team[],
        roundNumber: number,
        championPlayerId: string | null,
        championTeamId: string | null
    ): {
        round: Round;
        firstTrick: Trick;
    } {
        if (teams.length) {
            TeamManager.resetRoundStats(teams);
        }
        PlayerManager.resetRoundStats(players);
        PlayerManager.clearHands(players);
        DeckManager.dealCards(players);
        const round: Round = RoundFactory.create(roundNumber, championPlayerId, championTeamId);
        const trick: Trick = TrickFactory.create(1);
        return {
            round,
            firstTrick: trick
        };
    }
}