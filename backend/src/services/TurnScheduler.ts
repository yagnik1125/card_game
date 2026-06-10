import {
    Card,
    GameSession,
    GameSessionManager,
    PlayCardService,
    Player
} from "../../game-engine/src/index.js";

import { BotScheduler } from "./BotScheduler.js";
import { GameEventEmitter } from "../websocket/GameEventEmitter.js";

export class TurnScheduler {
    static playerPlay(
        gameId: string,
        playerId: string,
        cardId: string
    ): void {
        const session: GameSession = GameSessionManager.get(gameId);
        const player: Player | undefined = session.match.players.find((p: any) => p.id === playerId);
        if (!player) {
            throw new Error(
                "Player not found"
            );
        }
        const card: Card | undefined = player.hand.find(c => c.id === cardId);
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
        const updated: GameSession = GameSessionManager.get(gameId);
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