import { Trick, PlayedCard } from "./Trick";
import { Card } from "../core/Card";
import { Player } from "../core/Player";
import { RoundState } from "./RoundState";
import { TrumpManager } from "./TrumpManager";

export class TrickEngine {
  static validatePlay(
    trick: Trick,
    player: Player,
    card: Card
  ): boolean {
    if (!trick.leadSuit) {
      return true;
    }
    const hasLeadSuit = player.hand.some(c => c.suit === trick.leadSuit);
    if (!hasLeadSuit) {
      return true;
    }
    return card.suit === trick.leadSuit;
  }
  static playCard(
    trick: Trick,
    player: Player,
    card: Card,
    roundState: RoundState
  ) {
    const valid = this.validatePlay(trick, player, card);
    if (!valid) {
      throw new Error("Must follow suit");
    }
    if (!trick.leadSuit) {
      trick.leadSuit = card.suit;
    }
    if (
      trick.leadSuit &&
      TrumpManager.shouldDeclareTrump(
        player,
        card,
        trick.leadSuit,
        roundState
      )
    ) {
      TrumpManager.declareTrump(
        card,
        roundState
      );
      console.log(`Trump declared: ${card.suit}`);
    }
    trick.plays.push({
      playerId: player.id,
      card,
    });
    player.hand = player.hand.filter(c => c.id !== card.id);
  }
}