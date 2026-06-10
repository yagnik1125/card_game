import { Rank, Suit } from "./enums.js";

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}