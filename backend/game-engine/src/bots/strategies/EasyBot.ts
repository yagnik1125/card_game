import { Card } from "../../core/Card.js";
import { Player } from "../../core/Player.js";
import { BotStrategy } from "../BotStrategy.js";
import { BotDecision } from "../BotDecision.js";
import { RoundState } from "../../domain/round/RoundState.js";
import { Trick } from "../../domain/trick/Trick.js";

export class EasyBot
  implements BotStrategy {

  chooseCard(
    player: Player,
    legalCards: Card[],
    trick: Trick,
    roundState: RoundState
  ): BotDecision {

    const randomIndex: number =
      Math.floor(
        Math.random() *
        legalCards.length
      );
    return { card: legalCards[randomIndex] };
  }
}