import { Suit } from "../types/enums";
import { Card } from "../core/Card";

export interface PlayedCard {
  playerId: string;
  card: Card;
}
export interface Trick {
  trickNumber: number;
  leadSuit: Suit | null;
  winnerId?: string;
  plays: PlayedCard[];
}