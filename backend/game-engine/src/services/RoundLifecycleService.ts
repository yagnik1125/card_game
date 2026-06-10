import { Player } from "../core/Player.js";
import { DeckManager } from "../managers/DeckManager.js";
import { PlayerManager } from "../managers/PlayerManager.js";
import { RoundFactory } from "../factories/RoundFactory.js";
import { TrickFactory } from "../factories/TrickFactory.js";
import { Round } from "../domain/round/Round.js";
import { Trick } from "../domain/trick/Trick.js";

export class RoundLifecycleService {
    static startRound(
        players: Player[],
        roundNumber: number,
        championPlayerId: string | null
    ): {
        round: Round;
        firstTrick: Trick;
    } {
        PlayerManager.resetRoundStats(players);
        PlayerManager.clearHands(players);
        DeckManager.dealCards(players);
        const round: Round = RoundFactory.create(roundNumber, championPlayerId);
        const trick: Trick = TrickFactory.create(1);
        return {
            round,
            firstTrick: trick
        };
    }
}