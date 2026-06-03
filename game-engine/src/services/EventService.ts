import { GameEvent } from "../events/GameEvents";
import { GameSession } from "../session/GameSession";

export class EventService {
    static emit(
        session: GameSession,
        event: GameEvent
    ): void {
        session.events.push(event);
    }
}