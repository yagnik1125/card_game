import { Player } from "../core/Player";
import { Card } from "../core/Card";
import { Trick } from "../domain/trick/Trick";
import { LegalMoveGenerator } from "./LegalMoveGenerator";

export class MoveValidator {
    static canPlayCard(
        player: Player,
        card: Card,
        trick: Trick
    ): boolean {
        return LegalMoveGenerator.getLegalCards(player, trick).some(c => c.id === card.id);
    }
}