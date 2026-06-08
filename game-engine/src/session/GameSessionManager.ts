import { SessionStore } from "./SessionStore";
import { GameSession } from "./GameSession";

export class GameSessionManager {
    static create(session: GameSession):void {
        SessionStore.create(
            session
        );
    }
    static get(gameId: string): GameSession {
        const session = SessionStore.get(gameId);
        if (!session) {
            throw new Error(
                "Game not found"
            );
        }
        return session;
    }
    static save(session: GameSession) {
        SessionStore.create(session);
    }
    static remove(gameId: string) :void{
        SessionStore.remove(gameId);
    }
}