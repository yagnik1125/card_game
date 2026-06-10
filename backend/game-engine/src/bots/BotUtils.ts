import { Card } from "../core/Card.js";
import { Suit } from "../core/enums.js";

export class BotUtils {
    static strongestSuit(
        cards: Card[]
    ): Suit {
        const counts = new Map<Suit, number>();
        for (const card of cards) {
            counts.set(
                card.suit,
                (counts.get(card.suit) ?? 0)
                + card.rank
            );
        }
        if (!cards.length) {
            throw new Error(
                "No cards supplied"
            );
        }
        let bestSuit: Suit = cards[0].suit;
        let bestScore: number = 0;
        for (const [suit, score] of counts) {
            if (score > bestScore) {
                bestSuit = suit;
                bestScore = score;
            }
        }
        return bestSuit;
    }
}