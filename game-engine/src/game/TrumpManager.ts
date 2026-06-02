import { Suit } from "../types/enums";
import { Card } from "../core/Card";
import { Player } from "../core/Player";
import { RoundState } from "./RoundState";

export class TrumpManager {
    static canDeclareTrump(
        player: Player,
        round: RoundState
    ) {
        return (
            player.id !==
            round.championPlayerId
        );
    }
    static shouldDeclareTrump(
        player: Player,
        playedCard: Card,
        leadSuit: Suit,
        round: RoundState
    ): boolean {
        if (round.trumpDeclared) {
            return false;
        }
        if (!this.canDeclareTrump(player, round)) {
            return false;
        }
        if (playedCard.suit === leadSuit) {
            return false;
        }
        const hasLeadSuit =player.hand.some(card => card.suit === leadSuit);
        if (hasLeadSuit) {
            return false;
        }
        return true;
    }
    static declareTrump(
        card: Card,
        round: RoundState
    ) {
        round.trumpSuit =card.suit;
        round.trumpDeclared = true;
    }
}