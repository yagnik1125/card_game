import { GamePhase } from "../core/enums.js";
import { Match } from "../domain/match/Match.js";
import { GameSession } from "../session/GameSession.js";

export class GameSessionFactory {

    static create(
        match: Match
    ): GameSession {
        return {
            gameId: crypto.randomUUID(),
            match,
            phase: GamePhase.WAITING,
            currentPlayerId: null,
            gameState: null,
            events: [],
        };
    }
}