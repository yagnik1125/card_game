import { GameSession } from "../session/GameSession";
import { BotService } from "./BotService";
import { LegalMoveGenerator } from "../rules/LegalMoveGenerator";
import { TrickEngine } from "../engines/TrickEngine";
import { GameFlowService } from "./GameFlowService";
import { GameEvent } from "../events/GameEvents";
import { Player } from "../core/Player";
import { Card } from "../core/Card";
import { BotDecision } from "../bots/BotDecision";
import { Round, Trick } from "../domain";



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
            const trickBefore: Trick = session.gameState.currentTrick;
            const roundBefore: Round = session.gameState.currentRound;
            const matchBefore: boolean = session.gameState.completed;
            
            // Capture player stats BEFORE any changes (deep copy to avoid reference issues)
            const playerStatsBefore = session.match.players.map(p => ({
                playerId: p.id,
                tricksWonThisRound: p.stats.tricksWonThisRound,
                totalTricksWon: p.stats.totalTricksWon,
                cardsPlayed: p.stats.cardsPlayed
            }));
            
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
            const playersAfter: Player[] = session.match.players;
            const currentIndex: number = playersAfter.findIndex(p => p.id === currentPlayer.id);
            const nextPlayer: Player = playersAfter[(currentIndex + 1) % playersAfter.length];
            session.gameState.turnState.currentPlayerId = nextPlayer.id;
            GameFlowService.process(session);
            
            const trickAfter: number = session.gameState.currentTrick.trickNumber;
            const roundAfter: number = session.gameState.currentRound.state.roundNumber;
            const matchAfter: boolean = session.gameState.completed;
            
            if (!matchBefore && matchAfter) {
                const trickWinner: Player | undefined = session.match.players.find(p => p.id === trickBefore.winnerPlayerId);
                const roundWinner: Player | undefined = session.match.players.find(p => p.id === roundBefore.winnerPlayerId);
                
                // Get trick winner's stats from BEFORE the round reset
                const trickWinnerStatsBefore = playerStatsBefore.find(s => s.playerId === trickWinner!.id)!;
                
                events.push({
                    type: "MATCH_COMPLETED",
                    winner: session.match.result?.winnerPlayerId,
                    playerId: session.match.result?.winnerPlayerId,
                    trickWinner: {
                        id: trickWinner!.id,
                        name: trickWinner!.name,
                        // Use stats from before round reset: tricksWonThisRound was incremented by GameFlowService
                        tricksWonThisRound: trickWinnerStatsBefore.tricksWonThisRound + 1,
                    },
                    roundWinner: {
                        id: roundWinner!.id,
                        name: roundWinner!.name,
                        // Map all players' stats from BEFORE reset
                        players: playerStatsBefore.map((stats) => ({
                            id: stats.playerId,
                            name: session.match.players.find(p => p.id === stats.playerId)!.name,
                            // Add 1 to trick winner's stats since they just won this trick
                            tricksWonThisRound: stats.playerId === trickWinner!.id 
                                ? stats.tricksWonThisRound + 1 
                                : stats.tricksWonThisRound,
                        })),
                    }
                });
            }
            else if (roundAfter !== roundBefore.state.roundNumber) {
                const trickWinner: Player | undefined = session.match.players.find(p => p.id === trickBefore.winnerPlayerId);
                const roundWinner: Player | undefined = session.match.players.find(p => p.id === roundBefore.winnerPlayerId);
                
                // Get trick winner's stats from BEFORE the round reset
                const trickWinnerStatsBefore = playerStatsBefore.find(s => s.playerId === trickWinner!.id)!;
                
                events.push({
                    type: "ROUND_COMPLETED",
                    roundNumber: roundAfter,
                    playerId: session.gameState.leaderPlayerId,
                    trickWinner: {
                        id: trickWinner!.id,
                        name: trickWinner!.name,
                        // Use stats from before round reset: tricksWonThisRound was incremented by GameFlowService
                        tricksWonThisRound: trickWinnerStatsBefore.tricksWonThisRound + 1,
                    },
                    roundWinner: {
                        id: roundWinner!.id,
                        name: roundWinner!.name,
                        // Map all players' stats from BEFORE reset
                        players: playerStatsBefore.map((stats) => ({
                            id: stats.playerId,
                            name: session.match.players.find(p => p.id === stats.playerId)!.name,
                            // Add 1 to trick winner's stats since they just won this trick
                            tricksWonThisRound: stats.playerId === trickWinner!.id 
                                ? stats.tricksWonThisRound + 1 
                                : stats.tricksWonThisRound,
                        })),
                    }
                });
            }
            else if (trickAfter !== trickBefore.trickNumber) {
                const trickWinner: Player | undefined = session.match.players.find(p => p.id === trickBefore.winnerPlayerId);
                
                // Get trick winner's stats from BEFORE this trick was won
                const trickWinnerStatsBefore = playerStatsBefore.find(s => s.playerId === trickWinner!.id)!;
                
                events.push({
                    type: "TRICK_COMPLETED",
                    playerId: session.gameState.leaderPlayerId,
                    trickWinner: {
                        id: trickWinner!.id,
                        name: trickWinner!.name,
                        // GameFlowService already incremented tricksWonThisRound, so stats already reflect the win
                        tricksWonThisRound: trickWinnerStatsBefore.tricksWonThisRound + 1,
                    },
                });
            }
        }
        return events;
    }
}