import { GameSession } from "../session/GameSession.js";
import { BotService } from "./BotService.js";
import { LegalMoveGenerator } from "../rules/LegalMoveGenerator.js";
import { TrickEngine } from "../engines/TrickEngine.js";
import { GameFlowService } from "./GameFlowService.js";
import { GameEvent, RoundWinner, RoundWinnerTeam, TrickWinner, TrickWinnerTeam } from "../events/GameEvents.js";
import { Player } from "../core/Player.js";
import { Card } from "../core/Card.js";
import { BotDecision } from "../bots/BotDecision.js";
import { Round, Team, Trick } from "../domain/index.js";
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
                const trickWinnerPlayer: Player | undefined = session.match.players.find((p: { id: string | null; }) => p.id === trickBefore.winnerPlayerId);
                let roundWinnerPlayer: Player;
                let trickWinnerData: TrickWinner | undefined;
                let roundWinnerData: RoundWinner | undefined;
                const trickWinnerStatsBefore = playerStatsBefore.find(s => s.playerId === trickWinnerPlayer!.id)!;
                let trickWinnerTeamStatsBefore;
                let roundWinnerTeam: Team;
                let trickWinnerTeamData: TrickWinnerTeam | undefined = undefined;
                let roundWinnerTeamData: RoundWinnerTeam | undefined = undefined;
                let winnerPlayerId: string | undefined;
                let winnerTeamId: string | undefined;
                let playerId: string;
                trickWinnerData = {
                    id: trickWinnerPlayer!.id,
                    name: trickWinnerPlayer!.name,
                    // Use stats from before round reset: tricksWonThisRound was incremented by GameFlowService
                    tricksWonThisRound: trickWinnerStatsBefore.tricksWonThisRound + 1,
                };
                if (session.match.mode === GameMode.SOLO) {
                    winnerPlayerId = session.match.result?.winnerPlayerId;
                    playerId = winnerPlayerId!;
                    roundWinnerPlayer = session.match.players.find(p => p.id === roundBefore.winnerPlayerId)!;
                    roundWinnerData = {
                        id: roundWinnerPlayer!.id,
                        name: roundWinnerPlayer!.name,
                        // Map all players' stats from BEFORE reset
                        players: playerStatsBefore.map((stats) => ({
                            id: stats.playerId,
                            name: session.match.players.find(p => p.id === stats.playerId)!.name,
                            // Add 1 to trick winner's stats since they just won this trick
                            tricksWonThisRound: stats.playerId === trickWinnerPlayer!.id
                                ? stats.tricksWonThisRound + 1
                                : stats.tricksWonThisRound,
                        })),
                    };
                }
                else {
                    winnerTeamId = session.match.result?.winnerTeamId;
                    playerId = session.match.teams.find((t) => t.id === winnerTeamId)!.players[0].id;
                    roundWinnerTeam = session.match.teams.find((t) => t.id === roundBefore.winnerTeamId)!;
                    trickWinnerTeamStatsBefore = teamStatsBefore!.find((s) => s.id === trickWinnerPlayer!.teamId)!;
                    trickWinnerTeamData = {
                        id: trickWinnerTeamStatsBefore!.id,
                        name: trickWinnerTeamStatsBefore!.name,
                        tricksWonThisRound: trickWinnerTeamStatsBefore!.tricksWonThisRound + 1,
                        totalTricksWon: trickWinnerTeamStatsBefore!.totalTricksWon + 1,
                        roundsWon: trickWinnerTeamStatsBefore!.roundsWon,
                    };
                    roundWinnerTeamData = {
                        id: roundWinnerTeam!.id,
                        name: roundWinnerTeam!.name,
                        teams: teamStatsBefore!.map((stats) => ({
                            id: stats.id,
                            name: session.match.teams.find((t) => t.id === stats.id)!.name,
                            // Add 1 to trick winner's stats since they just won this trick
                            tricksWonThisRound: stats.id === trickWinnerPlayer!.teamId
                                ? stats.tricksWonThisRound + 1
                                : stats.tricksWonThisRound,
                            totalTricksWon: stats.id === trickWinnerPlayer!.teamId
                                ? stats.totalTricksWon + 1
                                : stats.totalTricksWon,
                            roundsWon: stats.id === roundWinnerTeam!.id
                                ? stats.roundsWon + 1
                                : stats.roundsWon,
                        })),
                    };
                }
                events.push({
                    type: "MATCH_COMPLETED",
                    winner: winnerPlayerId,
                    winnerTeam: winnerTeamId,
                    playerId: playerId,
                    trickWinner: trickWinnerData,
                    roundWinner: roundWinnerData,
                    trickWinnerTeam: trickWinnerTeamData,
                    roundWinnerTeam: roundWinnerTeamData
                });
            }
            else if (roundAfter !== roundBefore.state.roundNumber) {
                const trickWinnerPlayer: Player | undefined = session.match.players.find((p: { id: string | null; }) => p.id === trickBefore.winnerPlayerId);
                let roundWinnerPlayer: Player;
                let trickWinnerData: TrickWinner | undefined;
                let roundWinnerData: RoundWinner | undefined;
                const trickWinnerStatsBefore = playerStatsBefore.find(s => s.playerId === trickWinnerPlayer!.id)!;
                let trickWinnerTeamStatsBefore;
                let roundWinnerTeam: Team;
                let trickWinnerTeamData: TrickWinnerTeam | undefined = undefined;
                let roundWinnerTeamData: RoundWinnerTeam | undefined = undefined;
                trickWinnerData = {
                    id: trickWinnerPlayer!.id,
                    name: trickWinnerPlayer!.name,
                    // Use stats from before round reset: tricksWonThisRound was incremented by GameFlowService
                    tricksWonThisRound: trickWinnerStatsBefore.tricksWonThisRound + 1,
                };
                if (session.match.mode === GameMode.SOLO) {
                    roundWinnerPlayer = session.match.players.find(p => p.id === roundBefore.winnerPlayerId)!;
                    roundWinnerData = {
                        id: roundWinnerPlayer!.id,
                        name: roundWinnerPlayer!.name,
                        // Map all players' stats from BEFORE reset
                        players: playerStatsBefore.map((stats) => ({
                            id: stats.playerId,
                            name: session.match.players.find(p => p.id === stats.playerId)!.name,
                            // Add 1 to trick winner's stats since they just won this trick
                            tricksWonThisRound: stats.playerId === trickWinnerPlayer!.id
                                ? stats.tricksWonThisRound + 1
                                : stats.tricksWonThisRound,
                        })),
                    };
                }
                else {
                    roundWinnerTeam = session.match.teams.find((t) => t.id === roundBefore.winnerTeamId)!;
                    trickWinnerTeamStatsBefore = teamStatsBefore!.find((s) => s.id === trickWinnerPlayer!.teamId)!;
                    trickWinnerTeamData = {
                        id: trickWinnerTeamStatsBefore!.id,
                        name: trickWinnerTeamStatsBefore!.name,
                        tricksWonThisRound: trickWinnerTeamStatsBefore!.tricksWonThisRound + 1,
                        totalTricksWon: trickWinnerTeamStatsBefore!.totalTricksWon + 1,
                        roundsWon: trickWinnerTeamStatsBefore!.roundsWon,
                    };
                    roundWinnerTeamData = {
                        id: roundWinnerTeam!.id,
                        name: roundWinnerTeam!.name,
                        teams: teamStatsBefore!.map((stats) => ({
                            id: stats.id,
                            name: session.match.teams.find((t) => t.id === stats.id)!.name,
                            // Add 1 to trick winner's stats since they just won this trick
                            tricksWonThisRound: stats.id === trickWinnerPlayer!.teamId
                                ? stats.tricksWonThisRound + 1
                                : stats.tricksWonThisRound,
                            totalTricksWon: stats.id === trickWinnerPlayer!.teamId
                                ? stats.totalTricksWon + 1
                                : stats.totalTricksWon,
                            roundsWon: stats.id === roundWinnerTeam!.id
                                ? stats.roundsWon + 1
                                : stats.roundsWon,
                        })),
                    };
                }
                events.push({
                    type: "ROUND_COMPLETED",
                    roundNumber: roundAfter,
                    playerId: session.gameState.leaderPlayerId,
                    trickWinner: trickWinnerData,
                    roundWinner: roundWinnerData,
                    trickWinnerTeam: trickWinnerTeamData,
                    roundWinnerTeam: roundWinnerTeamData
                });
            }
            else if (trickAfter !== trickBefore.trickNumber) {
                const trickWinner: Player | undefined = session.match.players.find(p => p.id === trickBefore.winnerPlayerId);
                // Get trick winner's stats from BEFORE this trick was won
                const trickWinnerStatsBefore = playerStatsBefore.find(s => s.playerId === trickWinner!.id)!;
                let trickWinnerTeamStatsBefore;
                let trickWinnerTeam: TrickWinnerTeam | undefined = undefined;
                if (session.match.mode === GameMode.TEAMS_2V2) {
                    trickWinnerTeamStatsBefore = teamStatsBefore!.find((s) => s.id === trickWinner!.teamId)!;
                    trickWinnerTeam = {
                        id: trickWinnerTeamStatsBefore!.id,
                        name: trickWinnerTeamStatsBefore!.name,
                        tricksWonThisRound: trickWinnerTeamStatsBefore!.tricksWonThisRound + 1,
                        totalTricksWon: trickWinnerTeamStatsBefore!.totalTricksWon + 1,
                        roundsWon: trickWinnerTeamStatsBefore!.roundsWon,
                    };
                }
                events.push({
                    type: "TRICK_COMPLETED",
                    playerId: session.gameState.leaderPlayerId,
                    trickWinner: {
                        id: trickWinner!.id,
                        name: trickWinner!.name,
                        // GameFlowService already incremented tricksWonThisRound, so stats already reflect the win
                        tricksWonThisRound: trickWinnerStatsBefore.tricksWonThisRound + 1,
                    },
                    trickWinnerTeam
                });
            }
        }
        return events;
    }
}