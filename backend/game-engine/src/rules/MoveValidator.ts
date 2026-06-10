import { Player } from "../core/Player.js";
import { Card } from "../core/Card.js";
import { Trick } from "../domain/trick/Trick.js";
import { LegalMoveGenerator } from "./LegalMoveGenerator.js";

export class MoveValidator {
    static canPlayCard(
        player: Player,
        card: Card,
        trick: Trick
    ): boolean {
        return LegalMoveGenerator.getLegalCards(player, trick).some(c => c.id === card.id);
    }
}