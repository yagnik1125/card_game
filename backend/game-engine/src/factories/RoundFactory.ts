import { Round } from "../domain/round/Round.js";
import { RoundState } from "../domain/round/RoundState.js";

export class RoundFactory {
    static create(
        roundNumber: number,
        championPlayerId: string | null,
        championTeamId: string | null
    ): Round {
        const state: RoundState = {
            roundNumber,
            trumpSuit: null,
            trumpDeclared: false,
            championPlayerId,
            championTeamId
        };
        return {
            id: crypto.randomUUID(),
            state,
            tricks: [],
            history: [],
            winnerPlayerId: null,
            winnerTeamId: null
        };
    }
}