import { Card } from "../core/Card";
import { Player } from "../core/Player";
import { Trick } from "./Trick";

export class MoveGenerator {
  static getLegalCards(
    player: Player,
    trick: Trick
  ): Card[] {
    if (!trick.leadSuit) {
      return player.hand;
    }
    const matchingCards =
      player.hand.filter(
        card => card.suit === trick.leadSuit
      );
    if (matchingCards.length > 0) {
      return matchingCards;
    }
    return player.hand;
  }
}