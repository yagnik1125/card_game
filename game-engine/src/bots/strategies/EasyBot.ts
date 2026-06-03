import { Card } from "../../core/Card";
import { Player } from "../../core/Player";
import { BotStrategy } from "../BotStrategy";
import { BotDecision } from "../BotDecision";
import { RoundState } from "../../domain/round/RoundState";
import { Trick } from "../../domain/trick/Trick";

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