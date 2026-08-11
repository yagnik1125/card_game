import { EventBus } from "../../game-engine/src/events/EventBus.js";
import type { GameEventEnvelope } from "../../game-engine/src/events/GameEvents.js";
import { GameEventEmitter } from "./GameEventEmitter.js";

export class GameEventBridge {
    private static unsubscribe: (() => void) | undefined;

    static start(): void {
        if (this.unsubscribe) {
            return;
        }
        this.unsubscribe = EventBus.subscribe((payload) => {
            this.forward(payload);
        });
    }

    static stop(): void {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
    }

    private static forward({ gameId, event }: GameEventEnvelope): void {
        switch (event.type) {
            case "CARD_PLAYED":
                GameEventEmitter.cardPlayed(gameId, {
                    playerId: event.playerId,
                    cardId: event.cardId,
                    suit: event.suit,
                    rank: event.rank,
                });
                break;
            case "BOT_PLAY":
                GameEventEmitter.botPlayed(gameId, {
                    playerId: event.playerId,
                    cardId: event.cardId,
                    suit: event.suit,
                    rank: event.rank,
                });
                break;
            case "TURN_CHANGED":
                GameEventEmitter.turnChanged(gameId, {
                    currentPlayerId: event.currentPlayerId,
                    turnNumber: event.turnNumber,
                });
                break;
            case "TRUMP_DECLARED":
                GameEventEmitter.trumpDeclared(gameId, {
                    playerId: event.playerId,
                    suit: event.suit,
                });
                break;
            case "TRICK_COMPLETED":
                GameEventEmitter.trickCompleted(gameId, {
                    trickNumber: event.trickNumber,
                    winnerPlayerId: event.playerId,
                    trickWinner: event.trickWinner,
                    trickWinnerTeam: event.trickWinnerTeam,
                });
                break;
            case "ROUND_COMPLETED":
                GameEventEmitter.roundCompleted(gameId, {
                    roundNumber: event.roundNumber,
                    winnerPlayerId: event.playerId,
                    trickWinner: event.trickWinner,
                    trickWinnerTeam: event.trickWinnerTeam,
                    roundWinner: event.roundWinner,
                    roundWinnerTeam: event.roundWinnerTeam,
                });
                break;
            case "MATCH_COMPLETED":
                GameEventEmitter.matchCompleted(gameId, {
                    winnerPlayerId: event.winner ?? event.playerId,
                    winnerTeamId: event.winnerTeam,
                    roundWinner: event.roundWinner,
                    roundWinnerTeam: event.roundWinnerTeam,
                });
                break;
            case "ROUND_STARTED":
                GameEventEmitter.roundStarted(gameId, {
                    gameId,
                    roundNumber: event.roundNumber,
                    championPlayerId: event.championPlayerId,
                    championTeamId: event.championTeamId,
                });
                break;
            default:
                break;
        }
    }
}
