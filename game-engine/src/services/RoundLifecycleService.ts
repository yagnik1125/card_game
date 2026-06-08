import { Player } from "../core/Player";
import { DeckManager } from "../managers/DeckManager";
import { PlayerManager } from "../managers/PlayerManager";
import { RoundFactory } from "../factories/RoundFactory";
import { TrickFactory } from "../factories/TrickFactory";
import { Round } from "../domain/round/Round";
import { Trick } from "../domain/trick/Trick";

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