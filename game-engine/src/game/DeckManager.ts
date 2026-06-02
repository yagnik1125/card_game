import { Deck } from "../core/Deck";
import { Player } from "../core/Player";

export class DeckManager {
  static dealCards(
    players: Player[]
  ) {
    const deck = new Deck();
    deck.shuffle();
    const hands =deck.deal(players.length);
    players.forEach(
      (player, index) => {
        player.hand =hands[index];
      }
    );
  }
}