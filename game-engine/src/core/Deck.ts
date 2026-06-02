import { Card } from "./Card";
import { Rank, Suit } from "../types/enums";

export class Deck {
  cards: Card[] = [];

  constructor() {
    this.build();
  }

  private build() {
    const suits = Object.values(Suit);

    const ranks = [
      Rank.TWO,
      Rank.THREE,
      Rank.FOUR,
      Rank.FIVE,
      Rank.SIX,
      Rank.SEVEN,
      Rank.EIGHT,
      Rank.NINE,
      Rank.TEN,
      Rank.JACK,
      Rank.QUEEN,
      Rank.KING,
      Rank.ACE,
    ];

    let id = 1;

    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push({
          id: String(id++),
          suit,
          rank,
        });
      }
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(
        Math.random() * (i + 1)
      );

      [this.cards[i], this.cards[j]] =
        [this.cards[j], this.cards[i]];
    }
  }

  deal(players: number = 4) {
    const hands: Card[][] = Array.from(
      { length: players },
      () => []
    );

    this.cards.forEach((card, index) => {
      hands[index % players].push(card);
    });

    return hands;
  }
}