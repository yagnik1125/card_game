import { GameEvent } from "./GameEvents";

export class EventBus {
    private static events: GameEvent[] = [];
    static publish(event: GameEvent): void {
        this.events.push(event);
    }
    static getEvents(): GameEvent[] {
        return [...this.events];
    }
    static clear(): void {
        this.events = [];
    }
}