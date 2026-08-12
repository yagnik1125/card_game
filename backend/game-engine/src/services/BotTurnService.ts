import { GameSession } from "../session/GameSession.js";
import { BotService } from "./BotService.js";
import { LegalMoveGenerator } from "../rules/LegalMoveGenerator.js";
import { TrickEngine } from "../engines/TrickEngine.js";
import { GameFlowService } from "./GameFlowService.js";
import { EventBuilder } from "./EventBuilder.js";
import { GameEvent } from "../events/GameEvents.js";
import { Player } from "../core/Player.js";
import { Card } from "../core/Card.js";
import { BotDecision } from "../bots/BotDecision.js";
import { Round, Trick } from "../domain/index.js";
import { GameMode } from "../core/enums.js";



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
                session.gameState.currentRound.state,
                session.match.mode,
                session.match.players
            );
            TrickEngine.playCard(
                session.gameState.currentTrick,
                currentPlayer,
                decision.card,
                session.gameState.currentRound.state,
                session.match.mode
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
            let teamStatsBefore;
            if (session.match.mode === GameMode.TEAMS_2V2) {
                teamStatsBefore = session.match.teams.map((t) => ({
                    id: t.id,
                    name: t.name,
                    tricksWonThisRound: t.tricksWonThisRound,
                    totalTricksWon: t.totalTricksWon,
                    roundsWon: t.roundsWon
                }));
            }

            const legalCards: Card[] = LegalMoveGenerator.getLegalCards(currentPlayer, session.gameState.currentTrick);
            if (legalCards.length === 0) {
                break;
            }
            const decision: BotDecision = BotService.chooseCard(
                currentPlayer,
                legalCards,
                session.gameState.currentTrick,
                session.gameState.currentRound.state,
                session.match.mode,
                session.match.players
            );
            const trumpSuitBefore = session.gameState.currentRound.state.trumpSuit;
            TrickEngine.playCard(
                session.gameState.currentTrick,
                currentPlayer,
                decision.card,
                session.gameState.currentRound.state,
                session.match.mode
            );
            currentPlayer.stats.cardsPlayed++;
            const playersAfter: Player[] = session.match.players;
            const currentIndex: number = playersAfter.findIndex(p => p.id === currentPlayer.id);
            const nextPlayer: Player = playersAfter[(currentIndex + 1) % playersAfter.length];
            session.gameState.turnState.currentPlayerId = nextPlayer.id;
            GameFlowService.process(session);

            events.push(...EventBuilder.buildMoveEvents(
                session,
                currentPlayer.id,
                decision.card,
                true,
                {
                    trickBefore,
                    roundBefore,
                    matchBefore,
                    trumpBefore: trumpSuitBefore,
                    playerStatsBefore,
                    teamStatsBefore
                }
            ));
        }
        return events;
    }
}
