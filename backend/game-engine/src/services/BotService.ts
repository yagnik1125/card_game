import { Player } from "../core/Player.js";
import { Card } from "../core/Card.js";
import { Trick } from "../domain/trick/Trick.js";
import { RoundState } from "../domain/round/RoundState.js";
import { BotDecision } from "../bots/BotDecision.js";
import { GameMode } from "../core/enums.js";

export class BotService {
    static chooseCard(
        player: Player,
        legalCards: Card[],
        trick: Trick,
        roundState: RoundState,
        mode: GameMode,
        players?: Player[]
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
            roundState,
            mode,
            players
        );
    }
}