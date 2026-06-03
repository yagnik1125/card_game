import { GamePhase } from "../core/enums";
import { Match } from "../domain/match/Match";
import { GameSession } from "../session/GameSession";

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