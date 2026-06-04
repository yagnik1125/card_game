import { GameEvent } from "./GameEvent";

export interface PlayTurnResponse {
    events: GameEvent[];
    snapshot: any;
}