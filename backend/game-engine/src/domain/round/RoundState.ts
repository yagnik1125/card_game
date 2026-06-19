import { Suit } from "../../core/enums.js";

export interface RoundState {
    roundNumber: number;
    trumpSuit: Suit | null;
    championPlayerId: string | null;
    championTeamId: string | null;
    trumpDeclared: boolean;
}