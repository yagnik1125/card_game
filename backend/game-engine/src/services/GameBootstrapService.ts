import { Player } from "../core/Player.js";
import { Match } from "../domain/match/Match.js";
import { GameSessionFactory } from "../factories/GameSessionFactory.js";
import { GameSession } from "../session/GameSession.js";
import { GameSessionManager } from "../session/GameSessionManager.js";
import { MatchLifecycleService } from "./MatchLifecycleService.js";
import { RoundLifecycleService } from "./RoundLifecycleService.js";

export class GameBootstrapService {
    static createGame(
        players: Player[],
        totalRounds: number,
    ): GameSession {
        const match: Match = MatchLifecycleService.createMatch(players, totalRounds);
        const { round, firstTrick } = RoundLifecycleService.startRound(players, 1, null);
        const session: GameSession = GameSessionFactory.create(match);
        session.gameState = {
            currentRound: round,
            currentTrick: firstTrick,
            leaderPlayerId: players[0].id,
            completed: false,
            turnState: {
                currentPlayerId: players[0].id,
                turnNumber: 1,
            }
        };
        GameSessionManager.create(session);
        return session;
    }
}