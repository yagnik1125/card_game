import { Card } from "../core/Card.js";
import { Player } from "../core/Player.js";
import { GameMode, Suit } from "../core/enums.js";
import { RoundState } from "../domain/round/RoundState.js";

export class TrumpResolver {
    static shouldDeclareTrump(
        player: Player,
        card: Card,
        leadSuit: Suit,
        state: RoundState,
        mode: GameMode
    ): boolean {
        if (state.trumpDeclared) {
            return false;
        }
        if (mode === GameMode.SOLO && player.id === state.championPlayerId) {
            return false;
        }
        if (mode === GameMode.TEAMS_2V2 && player.teamId === state.championTeamId) {
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