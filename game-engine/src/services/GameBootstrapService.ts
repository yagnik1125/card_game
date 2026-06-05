import { Player } from "../core/Player";
import { GameSessionFactory } from "../factories/GameSessionFactory";
import { GameSessionManager } from "../session/GameSessionManager";
import { MatchLifecycleService } from "./MatchLifecycleService";
import { RoundLifecycleService } from "./RoundLifecycleService";

export class GameBootstrapService {
    static createGame(
        players: Player[],
        totalRounds: number,
    ) {
        const match = MatchLifecycleService.createMatch(players, totalRounds);
        const { round, firstTrick } = RoundLifecycleService.startRound(players, 1, null);
        const session = GameSessionFactory.create(match);
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