import { Card } from "../core/Card.js";
import { GameSessionManager } from "../session/GameSessionManager.js";
import { MoveValidator } from "../rules/MoveValidator.js";
import { TrickEngine } from "../engines/TrickEngine.js";
import { GameFlowService } from "./GameFlowService.js";
import { GameSession } from "../session/GameSession.js";
import { GameState } from "../session/GameState.js";
import { Player } from "../core/Player.js";

export class PlayCardService {
    static playCard(
        gameId: string,
        playerId: string,
        card: Card
    ): GameSession {
        const session: GameSession = GameSessionManager.get(gameId);
        if (!session.gameState) {
            throw new Error(
                "Game not initialized"
            );
        }
        const gameState: GameState = session.gameState;
        const player: Player | undefined = session.match.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error(
                "Player not found"
            );
        }
        if (gameState.turnState.currentPlayerId !== playerId) {
            throw new Error(
                "Not your turn"
            );
        }
        const valid: boolean = MoveValidator.canPlayCard(player, card, gameState.currentTrick);
        if (!valid) {
            throw new Error(
                "Invalid move"
            );
        }
        TrickEngine.playCard(
            gameState.currentTrick,
            player,
            card,
            gameState.currentRound.state,
            session.match.mode
        );
        player.stats.cardsPlayed++;
        this.moveToNextPlayer(session);
        GameFlowService.process(session);
        GameSessionManager.save(session);
        return session;
    }

    private static moveToNextPlayer(session: GameSession) {
        const players = session.match.players;
        const currentIndex = players.findIndex(
            (p: Player) => p.id === session.gameState!.turnState.currentPlayerId
        );
        const next = players[(currentIndex + 1) % players.length];
        session.gameState!.turnState.currentPlayerId = next.id;
        session.gameState!.turnState.turnNumber++;
    }
}