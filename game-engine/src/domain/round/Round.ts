import { Trick } from "../trick/Trick";
import { TrickHistory } from "../trick/TrickHistory";
import { RoundState } from "./RoundState";

export interface Round {
  id: string;
  state: RoundState;
  tricks: Trick[];
  history: TrickHistory[];
  winnerPlayerId: string | null;
}