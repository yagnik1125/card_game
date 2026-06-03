import { Suit } from "../../core/enums";
import { PlayedCard } from "./PlayedCard";

export interface Trick {
  id: string;
  trickNumber: number;
  leadSuit: Suit | null;
  plays: PlayedCard[];
  winnerPlayerId: string | null;
}