import { GameSession } from "../session/GameSession";
import { BotService } from "./BotService";
import { LegalMoveGenerator } from "../rules/LegalMoveGenerator";
import { TrickEngine } from "../engines/TrickEngine";
import { GameFlowService } from "./GameFlowService";
import { GameEvent } from "../events/GameEvents";
import { Player } from "../core/Player";
import { Card } from "../core/Card";
import { BotDecision } from "../bots/BotDecision";



export class BotTurnService {
    static executeBots(
        session: GameSession
    ) {
        if (!session.gameState) {
            return;
        }
        while (true) {
            const currentPlayer: Player | undefined = session.match.players.find(
                p => p.id === session.gameState!.turnState.currentPlayerId
            );
            if (!currentPlayer || !currentPlayer.isBot) {
                break;
            }
            const legalCards: Card[] = LegalMoveGenerator.getLegalCards(
                currentPlayer,
                session.gameState.currentTrick
            );
            const decision: BotDecision = BotService.chooseCard(
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
            const players: Player[] = session.match.players;
            const currentIndex: number = players.findIndex(p => p.id === currentPlayer.id);
            const nextPlayer: Player = players[(currentIndex + 1) % players.length];
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
            const currentPlayer: Player | undefined = session.match.players.find(p => p.id === session.gameState!.turnState.currentPlayerId);
            if (!currentPlayer || !currentPlayer.isBot) {
                break;
            }
            const trickBefore: number = session.gameState.currentTrick.trickNumber;
            const roundBefore: number = session.gameState.currentRound.state.roundNumber;
            const matchBefore: boolean = session.gameState.completed;
            const legalCards: Card[] = LegalMoveGenerator.getLegalCards(currentPlayer, session.gameState.currentTrick);
            if (legalCards.length === 0) {
                break;
            }
            const decision: BotDecision = BotService.chooseCard(
                currentPlayer,
                legalCards,
                session.gameState.currentTrick,
                session.gameState.currentRound.state
            );
            const trumpSuitBefore = session.gameState.currentRound.state.trumpSuit;
            TrickEngine.playCard(
                session.gameState.currentTrick,
                currentPlayer,
                decision.card,
                session.gameState.currentRound.state
            );
            const trumpSuitAfter = session.gameState.currentRound.state.trumpSuit;
            currentPlayer.stats.cardsPlayed++;
            if (!trumpSuitBefore && trumpSuitAfter) {
                events.push({
                    type: "TRUMP_DECLARED",
                    playerId: currentPlayer.id
                });
            }
            events.push({
                type: "BOT_PLAY",
                playerId: currentPlayer.id,
                cardId: decision.card.id,
                suit: decision.card.suit,
                rank: decision.card.rank,
            });
            const players: Player[] = session.match.players;
            const currentIndex: number = players.findIndex(p => p.id === currentPlayer.id);
            const nextPlayer: Player = players[(currentIndex + 1) % players.length];
            session.gameState.turnState.currentPlayerId = nextPlayer.id;
            GameFlowService.process(session);
            const trickAfter: number = session.gameState.currentTrick.trickNumber;
            const roundAfter: number = session.gameState.currentRound.state.roundNumber;
            const matchAfter: boolean = session.gameState.completed;
            if (!matchBefore && matchAfter) {
                events.push({
                    type: "MATCH_COMPLETED",
                    winner: session.match.result?.winnerPlayerId,
                    playerId: session.match.result?.winnerPlayerId
                });
            }
            else if (roundAfter !== roundBefore) {
                events.push({
                    type: "ROUND_COMPLETED",
                    roundNumber: roundAfter,
                    playerId: session.gameState.leaderPlayerId
                });
            }
            else if (trickAfter !== trickBefore) {
                events.push({
                    type: "TRICK_COMPLETED",
                    playerId: session.gameState.leaderPlayerId
                });
            }
        }
        return events;
    }
}