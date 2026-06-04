import { GameSession } from "../session/GameSession";
import { BotService } from "./BotService";
import { LegalMoveGenerator } from "../rules/LegalMoveGenerator";
import { TrickEngine } from "../engines/TrickEngine";
import { GameFlowService } from "./GameFlowService";
import { GameEvent } from "../events/GameEvents";



export class BotTurnService {
    static executeBots(
        session: GameSession
    ) {
        if (!session.gameState) {
            return;
        }
        while (true) {
            const currentPlayer = session.match.players.find(
                p => p.id === session.gameState!.turnState.currentPlayerId
            );
            if (!currentPlayer || !currentPlayer.isBot) {
                break;
            }
            const legalCards = LegalMoveGenerator.getLegalCards(
                currentPlayer,
                session.gameState.currentTrick
            );
            const decision = BotService.chooseCard(
                currentPlayer,
                legalCards,
                session.gameState.currentTrick,
                session.gameState.currentRound.state
            );
            TrickEngine.playCard(
                session.gameState.currentTrick,
                currentPlayer,
                decision.card,
                session.gameState.currentRound.state
            );
            currentPlayer.stats.cardsPlayed++;
            const players = session.match.players;
            const currentIndex = players.findIndex(p => p.id === currentPlayer.id);
            const nextPlayer = players[(currentIndex + 1) % players.length];
            session.gameState.turnState.currentPlayerId = nextPlayer.id;
            GameFlowService.process(session);
        }
    }

    static executeAllBots(
        session: GameSession
    ): GameEvent[] {
        const events: GameEvent[] = [];
        if (!session.gameState) {
            return events;
        }
        while (true) {
            const currentPlayer = session.match.players.find(p => p.id === session.gameState!.turnState.currentPlayerId);
            if (!currentPlayer || !currentPlayer.isBot) {
                break;
            }
            const trickBefore = session.gameState.currentTrick.trickNumber;
            const roundBefore = session.gameState.currentRound.state.roundNumber;
            const matchBefore = session.gameState.completed;
            const legalCards = LegalMoveGenerator.getLegalCards(currentPlayer, session.gameState.currentTrick);
            const decision = BotService.chooseCard(
                currentPlayer,
                legalCards,
                session.gameState.currentTrick,
                session.gameState.currentRound.state
            );
            TrickEngine.playCard(
                session.gameState.currentTrick,
                currentPlayer,
                decision.card,
                session.gameState.currentRound.state
            );
            currentPlayer.stats.cardsPlayed++;
            events.push({
                type: "BOT_PLAY",
                playerId: currentPlayer.id,
                cardId: decision.card.id,
                suit: decision.card.suit,
                rank: decision.card.rank,
            });
            const players = session.match.players;
            const currentIndex = players.findIndex(p => p.id === currentPlayer.id);
            const nextPlayer = players[(currentIndex + 1) % players.length];
            session.gameState.turnState.currentPlayerId = nextPlayer.id;
            GameFlowService.process(session);
            const trickAfter = session.gameState.currentTrick.trickNumber;
            if (trickAfter !== trickBefore) {
                events.push({
                    type: "TRICK_COMPLETED"
                });
            }
            const roundAfter = session.gameState.currentRound.state.roundNumber;
            if (roundAfter !== roundBefore) {
                events.push({
                    type: "ROUND_COMPLETED",
                    roundNumber: roundAfter
                });
            }
            const matchAfter = session.gameState.completed;
            if (!matchBefore && matchAfter) {
                events.push({
                    type: "MATCH_COMPLETED",
                    winner:
                        session.match.result?.winnerPlayerId
                });
            }
        }
        return events;
    }
}