import { Round } from "../domain/round/Round";
import { RoundState } from "../domain/round/RoundState";

export class RoundFactory {
    static create(
        roundNumber: number,
        championPlayerId: string | null
    ): Round {
        const state: RoundState = {
            roundNumber,
            trumpSuit: null,
            trumpDeclared: false,
            championPlayerId
        };
        return {
            id: crypto.randomUUID(),
            state,
            tricks: [],
            history: [],
            winnerPlayerId: null
        };
    }
}