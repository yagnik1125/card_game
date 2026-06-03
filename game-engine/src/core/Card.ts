import { Rank, Suit } from "./enums";

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}