import { Trick } from "../domain/trick/Trick";

export class TrickFactory {

    static create(
        trickNumber: number
    ): Trick {
        return {
            id: crypto.randomUUID(),
            trickNumber,
            leadSuit: null,
            plays: [],
            winnerPlayerId: null,
        };
    }
}