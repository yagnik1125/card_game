import { Suit } from "../../core/enums.js";
import { PlayedCard } from "./PlayedCard.js";

export interface Trick {
  id: string;
  trickNumber: number;
  leadSuit: Suit | null;
  plays: PlayedCard[];
  winnerPlayerId: string | null;
}