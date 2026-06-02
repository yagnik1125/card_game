import { Trick } from "./Trick";

export interface Round {
  roundNumber: number;
  tricks: Trick[];
  winnerId?: string;
}