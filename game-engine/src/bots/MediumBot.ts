import { Card } from "../core/Card";
import { Player } from "../core/Player";
import { Trick } from "../game/Trick";
import { RoundState } from "../game/RoundState";
import { BotStrategy } from "./BotStrategy";
import { BotDecision } from "./BotDecision";

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