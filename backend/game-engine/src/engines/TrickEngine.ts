import { Card } from "../core/Card.js";
import { Player } from "../core/Player.js";
import { RoundState } from "../domain/round/RoundState.js";
import { Trick } from "../domain/trick/Trick.js";
import { TrumpResolver } from "../rules/TrumpResolver.js";

export class TrickEngine {
  static validatePlay(
    trick: Trick,
    player: Player,
    card: Card
  ): boolean {
    if (!trick.leadSuit) {
      return true;
    }
    const hasLeadSuit: boolean = player.hand.some(c => c.suit === trick.leadSuit);
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
  ): void {
    const valid: boolean = this.validatePlay(trick, player, card);
    if (!valid) {
      throw new Error("Must follow suit");
    }
    if (!trick.leadSuit) {
      trick.leadSuit = card.suit;
    }
    if (
      trick.leadSuit &&
      TrumpResolver.shouldDeclareTrump(
        player,
        card,
        trick.leadSuit,
        roundState
      )
    ) {
      TrumpResolver.declareTrump(
        card,
        roundState
      );
      console.log(`Trump declared: ${card.suit}, by ${player.name}`);
    }
    trick.plays.push({
      playerId: player.id,
      card,
    });
    player.hand = player.hand.filter(c => c.id !== card.id);
  }
}