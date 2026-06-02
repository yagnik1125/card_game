import { Suit } from "../types/enums";

export interface RoundState {
    roundNumber: number;
    trumpSuit: Suit | null;
    championPlayerId: string | null;
    trumpDeclared: boolean;
}