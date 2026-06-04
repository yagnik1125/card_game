import { Card } from "../core/Card";
import { GameSessionManager } from "../session/GameSessionManager";
import { MoveValidator } from "../rules/MoveValidator";
import { TrickEngine } from "../engines/TrickEngine";
import { GameFlowService } from "./GameFlowService";

export class PlayCardService {
    static playCard(
        gameId: string,
        playerId: string,
        card: Card
    ) {
        const session = GameSessionManager.get(gameId);
        if (!session.gameState) {
            throw new Error(
                "Game not initialized"
            );
        }
        const gameState = session.gameState;
        const player = session.match.players.find(p => p.id === playerId);
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
        const valid = MoveValidator.canPlayCard(player, card, gameState.currentTrick);
        if (!valid) {
            throw new Error(
                "Invalid move"
            );
        }
        TrickEngine.playCard(
            gameState.currentTrick,
            player,
            card,
            gameState.currentRound.state
        );
        player.stats.cardsPlayed++;
        this.moveToNextPlayer(session);
        GameFlowService.process(session);
        GameSessionManager.save(session);
        return session;
    }

    private static moveToNextPlayer(session: any) {
        const players = session.match.players;
        const currentIndex = players.findIndex(
            (p: any) => p.id === session.gameState.turnState.currentPlayerId
        );
        const next = players[(currentIndex + 1) % players.length];
        session.gameState.turnState.currentPlayerId = next.id;
        session.gameState.turnState.turnNumber++;
    }
}