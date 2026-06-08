import { Player } from "../core/Player";
import { Card } from "../core/Card";
import { Trick } from "../domain/trick/Trick";
import { RoundState } from "../domain/round/RoundState";
import { BotDecision } from "../bots/BotDecision";

export class BotService {
    static chooseCard(
        player: Player,
        legalCards: Card[],
        trick: Trick,
        roundState: RoundState
    ): BotDecision {
        if (!player.strategy) {
            throw new Error(
                "Bot strategy missing"
            );
        }
        return player.strategy.chooseCard(
            player,
            legalCards,
            trick,
            roundState
        );
    }
}