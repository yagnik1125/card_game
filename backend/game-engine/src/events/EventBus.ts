import { GameEventEnvelope } from "./GameEvents.js";

export type GameEventListener = (payload: GameEventEnvelope) => void;

export class EventBus {
    private static readonly MAX_EVENTS_PER_GAME = 200;
    private static byGame: Map<string, GameEventEnvelope[]> = new Map();
    private static listeners: GameEventListener[] = [];

    static publish(payload: GameEventEnvelope): void {
        let gameEvents = this.byGame.get(payload.gameId);
        if (!gameEvents) {
            gameEvents = [];
            this.byGame.set(payload.gameId, gameEvents);
        }
        gameEvents.push(payload);
        if (gameEvents.length > this.MAX_EVENTS_PER_GAME) {
            gameEvents.splice(0, gameEvents.length - this.MAX_EVENTS_PER_GAME);
        }
        this.listeners.forEach((listener) => {
            try {
                listener(payload);
            } catch {
                // A listener must never break the game flow.
            }
        });
    }

    static subscribe(listener: GameEventListener): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    static getEvents(): GameEventEnvelope[] {
        return [...this.byGame.values()].flat();
    }

    static clear(): void {
        this.byGame.clear();
    }
}
