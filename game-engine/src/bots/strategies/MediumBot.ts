import { Card } from "../../core/Card";
import { Player } from "../../core/Player";
import { BotStrategy } from "../BotStrategy";
import { BotDecision } from "../BotDecision";
import { RoundState } from "../../domain/round/RoundState";
import { Trick } from "../../domain/trick/Trick";

export class MediumBot
implements BotStrategy {
  chooseCard(
    player: Player,
    legalCards: Card[],
    trick: Trick,
    roundState: RoundState
  ): BotDecision {
    const sorted =
      [...legalCards].sort(
        (a, b) =>
          a.rank - b.rank
      );
    return { card: sorted[0] };
  }
}