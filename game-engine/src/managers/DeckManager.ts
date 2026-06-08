import { Card } from "../core/Card";
import { Deck } from "../core/Deck";
import { Player } from "../core/Player";

export class DeckManager {
  static dealCards(
    players: Player[]
  ): void {
    const deck: Deck = new Deck();
    deck.shuffle();
    const hands: Card[][] = deck.deal(players.length);
    players.forEach(
      (player, index) => {
        player.hand = hands[index];
      }
    );
  }
}