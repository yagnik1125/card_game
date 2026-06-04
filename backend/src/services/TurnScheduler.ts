import {
    GameSessionManager,
    PlayCardService
} from "trump-and-twist-game-engine";

import { BotScheduler } from "./BotScheduler";
import { GameEventEmitter } from "../websocket/GameEventEmitter";

export class TurnScheduler {
    static playerPlay(
        gameId: string,
        playerId: string,
        cardId: string
    ) {
        const session = GameSessionManager.get(gameId);
        const player = session.match.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error(
                "Player not found"
            );
        }
        const card = player.hand.find(c => c.id === cardId);
        if (!card) {
            throw new Error(
                "Card not found"
            );
        }
        PlayCardService.playCard(gameId, playerId, card);
        GameEventEmitter.cardPlayed(
            gameId,
            {
                playerId,
                cardId,
                suit: card.suit,
                rank: card.rank
            }
        );
        const updated = GameSessionManager.get(gameId);
        GameEventEmitter.turnChanged(
            gameId,
            {
                currentPlayerId:
                    updated.gameState?.turnState.currentPlayerId
            }
        );
        BotScheduler.executeNextBot(gameId);
    }
}