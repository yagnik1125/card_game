import { Card } from "../core/Card";
import { Suit } from "../core/enums";

export interface BotDecision {
    card: Card;
    preferredTrump?: Suit;
}