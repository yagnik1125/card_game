import { Card } from "../core/Card.js";
import { Suit } from "../core/enums.js";
import { GameSessionManager } from "../session/GameSessionManager.js";
import { MoveValidator } from "../rules/MoveValidator.js";
import { TrickEngine } from "../engines/TrickEngine.js";
import { GameFlowService } from "./GameFlowService.js";
import { EventBus } from "../events/EventBus.js";
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
        const trumpBefore: Suit | null = gameState.currentRound.state.trumpSuit;
        TrickEngine.playCard(
            gameState.currentTrick,
            player,
            card,
            gameState.currentRound.state,
            session.match.mode
        );
        player.stats.cardsPlayed++;
        const trumpAfter: Suit | null = gameState.currentRound.state.trumpSuit;
        if (!trumpBefore && trumpAfter) {
            EventBus.publish({
                gameId,
                event: {
                    type: "TRUMP_DECLARED",
                    playerId,
                    suit: trumpAfter
                }
            });
        }
        EventBus.publish({
            gameId,
            event: {
                type: player.isBot ? "BOT_PLAY" : "CARD_PLAYED",
                playerId,
                cardId: card.id,
                suit: card.suit,
                rank: card.rank
            }
        });
        this.moveToNextPlayer(session);
        GameFlowService.process(session);
        if (!session.gameState!.completed) {
            EventBus.publish({
                gameId,
                event: {
                    type: "TURN_CHANGED",
                    currentPlayerId: session.gameState!.turnState.currentPlayerId,
                    turnNumber: session.gameState!.turnState.turnNumber
                }
            });
        }
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