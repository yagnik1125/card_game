import { Card } from "../core/Card";
import { Player } from "../core/Player";
import { Trick } from "../domain/trick/Trick";

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