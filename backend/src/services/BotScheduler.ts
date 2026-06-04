import {
    GameSessionManager,
    PlayCardService
} from "trump-and-twist-game-engine";

import { GameEventEmitter } from "../websocket/GameEventEmitter";

export class BotScheduler {
    static executeNextBot(
        gameId: string
    ) {
        const session = GameSessionManager.get(gameId);
        const currentPlayerId = session.gameState?.turnState.currentPlayerId;
        if (!currentPlayerId) {
            return;
        }
        const player = session.match.players.find(p => p.id === currentPlayerId);
        if (!player) {
            return;
        }
        if (player.id === "P1") {
            return;
        }
        const card = player.hand[0];
        if (!card) {
            return;
        }
        PlayCardService.playCard(gameId, player.id, card);
        GameEventEmitter.cardPlayed(
            gameId,
            {
                playerId: player.id,
                cardId: card.id,
                suit: card.suit,
                rank: card.rank
            }
        );
        const updated = GameSessionManager.get(gameId);
        GameEventEmitter.turnChanged(
            gameId,
            {
                currentPlayerId: updated.gameState?.turnState.currentPlayerId
            }
        );
        setTimeout(() => this.executeNextBot(gameId), 2000);
    }
}