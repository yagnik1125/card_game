import { Card } from "../core/Card.js";
import { Suit } from "../core/enums.js";

export interface BotDecision {
    card: Card;
    preferredTrump?: Suit;
}