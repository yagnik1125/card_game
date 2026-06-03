import { GameSession } from "./GameSession";

export class SessionStore {
    private static sessions = new Map<string, GameSession>();
    static create(session: GameSession): void {
        this.sessions.set(session.gameId, session);
    }
    static get(gameId: string): GameSession | undefined {
        return this.sessions.get(gameId);
    }
    static remove(gameId: string): void {
        this.sessions.delete(gameId);
    }
    static getAll(): GameSession[] {
        return Array.from(
            this.sessions.values()
        );
    }
}