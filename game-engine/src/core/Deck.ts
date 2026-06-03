import { Card } from "./Card";
import { Rank, Suit } from "./enums";

export class Deck {
  cards: Card[] = [];

  constructor() {
    this.build();
  }

  private build(): void {
    const suits = Object.values(Suit);

    const ranks = Object.values(Rank).filter(value => typeof value === "number");

    let id: number = 1;

    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push({
          id: String(id++),
          suit,
          rank: rank as Rank,
        });
      }
    }
  }

  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(
        Math.random() * (i + 1)
      );

      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
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