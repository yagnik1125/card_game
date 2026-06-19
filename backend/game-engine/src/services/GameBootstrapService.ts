import { GameMode } from "../core/enums.js";
import { Player } from "../core/Player.js";
import { Match } from "../domain/match/Match.js";
import { Team } from "../domain/team/Team.js";
import { GameSessionFactory } from "../factories/GameSessionFactory.js";
import { GameSession } from "../session/GameSession.js";
import { GameSessionManager } from "../session/GameSessionManager.js";
import { MatchLifecycleService } from "./MatchLifecycleService.js";
import { RoundLifecycleService } from "./RoundLifecycleService.js";

export class GameBootstrapService {
    static createGame(
        players: Player[],
        teams: Team[],
        totalRounds: number,
        mode: GameMode
    ): GameSession {
        const match: Match = MatchLifecycleService.createMatch(players, teams, totalRounds, mode);
        const { round, firstTrick } = RoundLifecycleService.startRound(players, teams, 1, null, null);
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