import { Card } from "../core/Card.js";
import { Player } from "../core/Player.js";
import { Trick } from "../domain/trick/Trick.js";

export class LegalMoveGenerator {
    static getLegalCards(
        player: Player,
        trick: Trick
    ): Card[] {
        if (!trick.leadSuit) {
            return player.hand;
        }
        const matchingCards: Card[] = player.hand.filter(card => card.suit === trick.leadSuit);
        if (matchingCards.length) {
            return matchingCards;
        }
        return player.hand;
    }
}