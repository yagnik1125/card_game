import { GameEvent } from "./GameEvent.js";

export interface PlayTurnResponse {
    events: GameEvent[];
    snapshot: any;
}