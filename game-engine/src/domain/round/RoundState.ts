import { Suit } from "../../core/enums";

export interface RoundState {
    roundNumber: number;
    trumpSuit: Suit | null;
    championPlayerId: string | null;
    trumpDeclared: boolean;
}