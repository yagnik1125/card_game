import { Trick } from "../domain/trick/Trick";

export interface PlayCardResult {
    trickCompleted: boolean;
    roundCompleted: boolean;
    matchCompleted: boolean;
    nextPlayerId: string | null;
    currentTrick: Trick;
}