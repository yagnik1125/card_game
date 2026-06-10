import { Trick } from "../domain/trick/Trick.js";

export interface PlayCardResult {
    trickCompleted: boolean;
    roundCompleted: boolean;
    matchCompleted: boolean;
    nextPlayerId: string | null;
    currentTrick: Trick;
}