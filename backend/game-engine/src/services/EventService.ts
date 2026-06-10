import { GameEvent } from "../events/GameEvents.js";
import { GameSession } from "../session/GameSession.js";

export class EventService {
    static emit(
        session: GameSession,
        event: GameEvent
    ): void {
        session.events.push(event);
    }
}