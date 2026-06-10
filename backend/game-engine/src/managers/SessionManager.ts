import { SessionStore } from "../session/SessionStore.js";
import { GameSession } from "../session/GameSession.js";

export class SessionManager {
    static create(session: GameSession): void {
        SessionStore.create(session);
    }
    static get(gameId: string): GameSession {
        const session: GameSession | undefined = SessionStore.get(gameId);
        if (!session) {
            throw new Error(
                "Game session not found"
            );
        }
        return session;
    }
    static remove(gameId: string): void {
        SessionStore.remove(gameId);
    }
}