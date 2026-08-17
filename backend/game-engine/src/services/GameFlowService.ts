import { GameMode } from "../core/enums.js";
import { Player } from "../core/Player.js";
import { Round } from "../domain/round/Round.js";
import { Team } from "../domain/team/Team.js";
import { PlayedCard } from "../domain/trick/PlayedCard.js";
import { Trick } from "../domain/trick/Trick.js";
import { EventBus } from "../events/EventBus.js";
import { TrickWinnerTeam } from "../events/GameEvents.js";
import { TrickFactory } from "../factories/TrickFactory.js";
import { WinnerResolver } from "../rules/WinnerResolver.js";
import { GameSession } from "../session/GameSession.js";
import { GameState } from "../session/GameState.js";
import { RoundLifecycleService } from "./RoundLifecycleService.js";

export class GameFlowService {
    static process(session: GameSession): void {
        if (!session.gameState) {
            return;
        }
        this.processTrick(session);
        this.processRound(session);
        this.processMatch(session);
    }
    private static processTrick(session: GameSession): void {
        const state: GameState = session.gameState!;
        const trick: Trick = state.currentTrick;
        if (trick.plays.length < session.match.players.length) {
            return;
        }
        const winner: PlayedCard = WinnerResolver.resolve(trick, state.currentRound.state);
        trick.winnerPlayerId = winner.playerId;
        const winnerPlayer: Player = session.match.players.find(p => p.id === winner.playerId)!;
        winnerPlayer.stats.tricksWonThisRound++;
        winnerPlayer.stats.totalTricksWon++;
        if (session.match.mode === GameMode.TEAMS_2V2) {
            const team: Team = session.match.teams.find(t => t.id === winnerPlayer.teamId)!;
            team.tricksWonThisRound++;
            team.totalTricksWon++;
        }
        state.leaderPlayerId = winnerPlayer.id;
        if (!state.currentRound.tricks.some(t => t.id === trick.id)) {
            state.currentRound.tricks.push(trick);
        }
        let trickWinnerTeam: TrickWinnerTeam | undefined;
        if (session.match.mode === GameMode.TEAMS_2V2) {
            const team: Team = session.match.teams.find(t => t.id === winnerPlayer.teamId)!;
            trickWinnerTeam = {
                id: team.id,
                name: team.name,
                tricksWonThisRound: team.tricksWonThisRound,
                totalTricksWon: team.totalTricksWon,
                roundsWon: team.roundsWon
            };
        }
        state.currentTrick = TrickFactory.create(trick.trickNumber + 1);
        state.turnState.currentPlayerId = winnerPlayer.id;
        state.turnState.turnNumber = 1;
        EventBus.publish({
            gameId: session.gameId,
            event: {
                type: "TRICK_COMPLETED",
                trickNumber: trick.trickNumber,
                playerId: winnerPlayer.id,
                trickWinner: {
                    id: winnerPlayer.id,
                    name: winnerPlayer.name,
                    tricksWonThisRound: winnerPlayer.stats.tricksWonThisRound
                },
                trickWinnerTeam
            }
        });
    }
    private static processRound(session: GameSession): void {
        const players: Player[] = session.match.players;
        const roundFinished: boolean = players.every(p => p.hand.length === 0);
        if (!roundFinished) {
            return;
        }
        // const { round, firstTrick } = RoundLifecycleService.startRound(players, nextRoundNumber, winner.id);
        if (session.match.mode === GameMode.SOLO) {
            const winner: Player = players.reduce(
                (best, current) => current.stats.tricksWonThisRound > best.stats.tricksWonThisRound ? current : best
            );
            winner.stats.roundsWon++;
            session.gameState!.currentRound.winnerPlayerId = winner.id;
            session.match.rounds.push(session.gameState!.currentRound);
            session.match.state.championPlayerId = winner.id;
            EventBus.publish({
                gameId: session.gameId,
                event: {
                    type: "ROUND_COMPLETED",
                    roundNumber: session.gameState!.currentRound.state.roundNumber,
                    playerId: winner.id,
                    roundWinner: {
                        id: winner.id,
                        name: winner.name,
                        players: players.map((p) => ({
                            id: p.id,
                            name: p.name,
                            tricksWonThisRound: p.stats.tricksWonThisRound
                        }))
                    }
                }
            });
            if (session.match.state.currentRound >= session.match.state.totalRounds) {
                return;
            }
            session.match.state.currentRound++;
            const nextRoundNumber: number = session.match.state.currentRound;
            const { round, firstTrick } = RoundLifecycleService.startRound(players, session.match.teams, nextRoundNumber, winner.id, null);
            session.gameState!.currentRound = round;
            session.gameState!.currentTrick = firstTrick;
            session.gameState!.leaderPlayerId = winner.id;
            session.gameState!.turnState = {
                currentPlayerId: winner.id,
                turnNumber: 1
            };
            EventBus.publish({
                gameId: session.gameId,
                event: {
                    type: "ROUND_STARTED",
                    roundNumber: session.match.state.currentRound,
                    championPlayerId: winner.id,
                    championTeamId: null
                }
            });
        }
        else {
            const winnerTeam: Team = session.match.teams.reduce(
                (best, current) => current.tricksWonThisRound > best.tricksWonThisRound ? current : best
            );
            winnerTeam.roundsWon++;
            session.gameState!.currentRound.winnerTeamId = winnerTeam.id;
            session.match.rounds.push(session.gameState!.currentRound);
            session.match.state.championTeamId = winnerTeam.id;
            EventBus.publish({
                gameId: session.gameId,
                event: {
                    type: "ROUND_COMPLETED",
                    roundNumber: session.gameState!.currentRound.state.roundNumber,
                    playerId: winnerTeam.players[0].id,
                    roundWinnerTeam: {
                        id: winnerTeam.id,
                        name: winnerTeam.name,
                        teams: session.match.teams.map((t) => ({
                            id: t.id,
                            name: t.name,
                            tricksWonThisRound: t.tricksWonThisRound,
                            totalTricksWon: t.totalTricksWon,
                            roundsWon: t.roundsWon
                        }))
                    }
                }
            });
            if (session.match.state.currentRound >= session.match.state.totalRounds) {
                return;
            }
            session.match.state.currentRound++;
            const nextRoundNumber: number = session.match.state.currentRound;
            const { round, firstTrick } = RoundLifecycleService.startRound(players, session.match.teams, nextRoundNumber, winnerTeam.players[0].id, winnerTeam.id);
            session.gameState!.currentRound = round;
            session.gameState!.currentTrick = firstTrick;
            session.gameState!.leaderPlayerId = winnerTeam.players[0].id;
            session.gameState!.turnState = {
                currentPlayerId: winnerTeam.players[0].id,
                turnNumber: 1
            };
            EventBus.publish({
                gameId: session.gameId,
                event: {
                    type: "ROUND_STARTED",
                    roundNumber: session.match.state.currentRound,
                    championPlayerId: winnerTeam.players[0].id,
                    championTeamId: winnerTeam.id
                }
            });
        }
    }
    private static processMatch(session: GameSession): void {
        const matchEnded: boolean = session.match.state.currentRound === session.match.state.totalRounds
            && session.match.players.every(p => p.hand.length === 0);
        if (!matchEnded) {
            return;
        }
        if (session.match.mode === GameMode.SOLO) {
            const winner: Player = this.resolveSoloMatchWinner(session.match.players);
            session.match.result = {
                winnerPlayerId: winner.id,
                totalTricksWon: winner.stats.totalTricksWon,
                roundsWon: winner.stats.roundsWon
            };
        }
        else {
            const winnerTeam: Team = this.resolveTeamMatchWinner(session.match.teams);
            session.match.result = {
                winnerTeamId: winnerTeam.id,
                totalTricksWon: winnerTeam.totalTricksWon,
                roundsWon: winnerTeam.roundsWon
            };
        }
        session.match.state.isCompleted = true;
        session.gameState!.completed = true;
        EventBus.publish({
            gameId: session.gameId,
            event: {
                type: "MATCH_COMPLETED",
                winner: session.match.result?.winnerPlayerId,
                winnerTeam: session.match.result?.winnerTeamId,
                playerId: session.match.result?.winnerPlayerId
            }
        });
    }
    static resolveSoloMatchWinner(players: Player[]): Player {
        return players.reduce(
            (best, current) =>
                current.stats.roundsWon > best.stats.roundsWon ||
                (current.stats.roundsWon === best.stats.roundsWon && current.stats.totalTricksWon > best.stats.totalTricksWon)
                    ? current
                    : best
        );
    }
    static resolveTeamMatchWinner(teams: Team[]): Team {
        return teams.reduce(
            (best, current) =>
                current.roundsWon > best.roundsWon ||
                (current.roundsWon === best.roundsWon && current.totalTricksWon > best.totalTricksWon)
                    ? current
                    : best
        );
    }
}