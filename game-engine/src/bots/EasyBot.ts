import { Card } from "../core/Card";
import { Player } from "../core/Player";
import { Trick } from "../game/Trick";
import { RoundState } from "../game/RoundState";
import { BotStrategy } from "./BotStrategy";
import { BotDecision } from "./BotDecision";

export class EasyBot
  implements BotStrategy {

  chooseCard(
    player: Player,
    legalCards: Card[],
    trick: Trick,
    roundState: RoundState
  ): BotDecision {

    const randomIndex =
      Math.floor(
        Math.random() *
        legalCards.length
      );
    return { card: legalCards[randomIndex] };
  }
}