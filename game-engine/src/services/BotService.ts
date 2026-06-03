import { Player } from "../core/Player";
import { Card } from "../core/Card";
import { Trick } from "../domain/trick/Trick";
import { RoundState } from "../domain/round/RoundState";

export class BotService {
    static chooseCard(
        player: Player,
        legalCards: Card[],
        trick: Trick,
        roundState: RoundState
    ) {
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