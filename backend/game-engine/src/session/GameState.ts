import { Round } from "../domain/round/Round.js";
import { Trick } from "../domain/trick/Trick.js";
import { TurnState } from "../domain/turn/TurnState.js";

export interface GameState {
    currentRound: Round;
    currentTrick: Trick;
    turnState: TurnState;
    leaderPlayerId: string;
    completed: boolean;
}