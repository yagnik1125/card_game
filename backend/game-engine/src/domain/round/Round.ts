import { Trick } from "../trick/Trick.js";
import { TrickHistory } from "../trick/TrickHistory.js";
import { RoundState } from "./RoundState.js";

export interface Round {
  id: string;
  state: RoundState;
  tricks: Trick[];
  history: TrickHistory[];
  winnerPlayerId: string | null;
}