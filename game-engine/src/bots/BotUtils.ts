import { Card } from "../core/Card";
import { Suit } from "../types/enums";

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
        let bestSuit =cards[0].suit;
        let bestScore = 0;
        for (const [suit, score] of counts) {
            if (score > bestScore) {
                bestSuit = suit;
                bestScore = score;
            }
        }
        return bestSuit;
    }
}