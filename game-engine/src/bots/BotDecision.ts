import { Card } from "../core/Card";
import { Suit } from "../types/enums";

export interface BotDecision {
    card: Card;
    preferredTrump?: Suit;
}