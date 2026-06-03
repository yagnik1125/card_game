import { Round } from "../domain/round/Round";
import { Trick } from "../domain/trick/Trick";
import { TurnState } from "../domain/turn/TurnState";

export interface GameState {
    currentRound: Round;
    currentTrick: Trick;
    turnState: TurnState;
    leaderPlayerId: string;
    completed: boolean;
}