import { GameMode } from "../core/enums.js";
import { Player } from "../core/Player.js";
import { Round } from "../domain/round/Round.js";
import { Team } from "../domain/team/Team.js";
import { PlayedCard } from "../domain/trick/PlayedCard.js";
import { Trick } from "../domain/trick/Trick.js";
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
        if (winnerPlayer.hand.length === 0) {
            return;
        }
        state.currentTrick = TrickFactory.create(trick.trickNumber + 1);
        state.turnState.currentPlayerId = winnerPlayer.id;
        state.turnState.turnNumber = 1;
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
        }
        else {
            const winnerTeam: Team = session.match.teams.reduce(
                (best, current) => current.tricksWonThisRound > best.tricksWonThisRound ? current : best
            );
            winnerTeam.roundsWon++;
            session.gameState!.currentRound.winnerTeamId = winnerTeam.id;
            session.match.rounds.push(session.gameState!.currentRound);
            session.match.state.championTeamId = winnerTeam.id;
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
        }
    }
    private static processMatch(session: GameSession): void {
        const matchEnded: boolean = session.match.state.currentRound === session.match.state.totalRounds
            && session.match.players.every(p => p.hand.length === 0);
        if (!matchEnded) {
            return;
        }
        if (session.match.mode === GameMode.SOLO) {
            const winner: Player = session.match.players.reduce(
                (best, current) => current.stats.totalTricksWon > best.stats.totalTricksWon ? current : best
            );
            session.match.result = {
                winnerPlayerId: winner.id,
                totalTricksWon: winner.stats.totalTricksWon
            };
        }
        else {
            const winnerTeam = session.match.teams.reduce(
                (best, current) =>
                    current.roundsWon > best.roundsWon || (current.roundsWon === best.roundsWon && current.totalTricksWon > best.totalTricksWon)
                        ? current
                        : best
            );
            session.match.result = {
                winnerTeamId: winnerTeam.id,
                totalTricksWon: winnerTeam.totalTricksWon
            };
        }
        session.match.state.isCompleted = true;
        session.gameState!.completed = true;
    }
}