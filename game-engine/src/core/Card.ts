import { Rank, Suit } from "../types/enums";

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}