import { EventBus } from "../../game-engine/src/events/EventBus.js";
import type { GameEventEnvelope } from "../../game-engine/src/events/GameEvents.js";
import { GameService } from "../services/GameService.js";
import { GameEventEmitter } from "./GameEventEmitter.js";
import { wsLog, wsGameLog } from "./wsLogger.js";

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
        wsLog(`bridge forward game=${gameId} event=${event.type}`);
        switch (event.type) {
            case "CARD_PLAYED":
                wsGameLog(gameId, `card played player=${event.playerId} card=${event.cardId} suit=${event.suit} rank=${event.rank}`);
                GameEventEmitter.cardPlayed(gameId, {
                    playerId: event.playerId,
                    cardId: event.cardId,
                    suit: event.suit,
                    rank: event.rank,
                });
                break;
            case "BOT_PLAY":
                wsGameLog(gameId, `bot played player=${event.playerId} card=${event.cardId} suit=${event.suit} rank=${event.rank}`);
                GameEventEmitter.botPlayed(gameId, {
                    playerId: event.playerId,
                    cardId: event.cardId,
                    suit: event.suit,
                    rank: event.rank,
                });
                break;
            case "TURN_CHANGED": {
                let legalMoves: string[] = [];
                if (event.currentPlayerId === "P1") {
                    try {
                        legalMoves = GameService.getLegalMoves(
                            gameId,
                            "P1"
                        ).map((card) => card.id);
                    } catch {
                        legalMoves = [];
                    }
                }
                wsGameLog(gameId, `turn changed player=${event.currentPlayerId} turn=${event.turnNumber} legalMoves=${legalMoves.length}`);
                GameEventEmitter.turnChanged(gameId, {
                    currentPlayerId: event.currentPlayerId,
                    turnNumber: event.turnNumber,
                    legalMoves,
                });
                break;
            }
            case "TRUMP_DECLARED":
                wsGameLog(gameId, `trump declared suit=${event.suit}`);
                GameEventEmitter.trumpDeclared(gameId, {
                    playerId: event.playerId,
                    suit: event.suit,
                });
                break;
            case "TRICK_COMPLETED":
                wsGameLog(gameId, `trick completed trick=${event.trickNumber} winner=${event.playerId}`);
                GameEventEmitter.trickCompleted(gameId, {
                    trickNumber: event.trickNumber,
                    winnerPlayerId: event.playerId,
                    trickWinner: event.trickWinner,
                    trickWinnerTeam: event.trickWinnerTeam,
                });
                break;
            case "ROUND_COMPLETED":
                wsGameLog(gameId, `round completed round=${event.roundNumber} winner=${event.playerId}`);
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
                wsGameLog(gameId, `match completed winner=${event.winner ?? event.playerId} winnerTeam=${event.winnerTeam}`);
                GameEventEmitter.matchCompleted(gameId, {
                    winnerPlayerId: event.winner ?? event.playerId,
                    winnerTeamId: event.winnerTeam,
                    roundWinner: event.roundWinner,
                    roundWinnerTeam: event.roundWinnerTeam,
                });
                break;
            case "ROUND_STARTED": {
                let snapshot: unknown;
                try {
                    snapshot = GameService.getView(gameId);
                } catch {
                    snapshot = undefined;
                }
                wsGameLog(gameId, `round started round=${event.roundNumber} champion=${event.championPlayerId} championTeam=${event.championTeamId}`);
                GameEventEmitter.roundStarted(gameId, {
                    gameId,
                    roundNumber: event.roundNumber,
                    championPlayerId: event.championPlayerId,
                    championTeamId: event.championTeamId,
                }, snapshot);
                break;
            }
            default:
                break;
        }
    }
}
