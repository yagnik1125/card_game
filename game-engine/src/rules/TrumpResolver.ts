import { Card } from "../core/Card";
import { Player } from "../core/Player";
import { Suit } from "../core/enums";
import { RoundState } from "../domain/round/RoundState";

export class TrumpResolver {
    static shouldDeclareTrump(
        player: Player,
        card: Card,
        leadSuit: Suit,
        state: RoundState
    ): boolean {
        if (state.trumpDeclared) {
            return false;
        }
        if (player.id === state.championPlayerId) {
            return false;
        }
        if (card.suit === leadSuit) {
            return false;
        }
        const hasLeadSuit: boolean = player.hand.some(c => c.suit === leadSuit);
        return !hasLeadSuit;
    }
    static declareTrump(card: Card, state: RoundState): void {
        state.trumpSuit = card.suit;
        state.trumpDeclared = true;
    }
}