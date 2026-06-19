import { RoundEngine } from "./RoundEngine.js";
import { PlayerFactory } from "../factories/PlayerFactory.js";
import { DeckManager } from "../managers/DeckManager.js";
import { PlayerManager } from "../managers/PlayerManager.js";
import { RoundState } from "../domain/round/RoundState.js";
import { Player } from "../core/Player.js";
import { GameMode } from "../core/enums.js";
import { Team } from "../domain/index.js";
import { TeamFactory } from "../factories/TeamFactory.js";
import { TeamManager } from "../managers/TeamManager.js";

export class MatchEngine {
    static playMatch(mode: GameMode) {
        let previousChampionId: string | null = null;
        let previousChampionTeamId: string | null = null;
        const roundWinners: string[] = [];
        const roundWinnerTeams: string[] = [];
        const players: Player[] = PlayerFactory.createPlayers("hard");
        let teams: Team[] = [];
        if (mode === GameMode.TEAMS_2V2) {
            teams = TeamFactory.createDefaultTeams(players);
        }
        for (let roundNumber: number = 1; roundNumber <= 2; roundNumber++) {
            console.log(`\n================ ROUND ${roundNumber} ================`);
            if (mode === GameMode.TEAMS_2V2) {
                TeamManager.resetRoundStats(teams);
            }
            PlayerManager.resetRoundStats(players);
            PlayerManager.clearHands(players);
            DeckManager.dealCards(players);
            const roundState: RoundState = {
                roundNumber,
                trumpSuit: null,
                championPlayerId: previousChampionId,
                championTeamId: previousChampionTeamId,
                trumpDeclared: false,
            };
            if (mode === GameMode.SOLO) {
                const championId: string =
                    RoundEngine.playRound(
                        players,
                        roundState,
                        "P1",
                        teams,
                        mode
                    );
                roundWinners.push(championId);
                previousChampionId = championId;
                console.log(`Round ${roundNumber} Champion: ${championId}`);
            }
            else {
                const championTeamId: string =
                    RoundEngine.playRound(
                        players,
                        roundState,
                        "P1",
                        teams,
                        mode
                    );
                roundWinnerTeams.push(championTeamId);
                previousChampionTeamId = championTeamId;
                console.log(`Round ${roundNumber} Champion Team: ${championTeamId}`);
            }
        }
        if (mode === GameMode.SOLO) {
            const matchWinner: Player =
                players.reduce(
                    (best, current) =>
                        current.stats.totalTricksWon >
                            best.stats.totalTricksWon
                            ? current
                            : best
                );
            console.log("\n===== MATCH RESULTS =====");
            players.forEach(player => {
                console.log(`${player.name}: ${player.stats.totalTricksWon} tricks`);
            });
            console.log(`\nMatch Winner: ${matchWinner.name}`);
            return {
                roundWinners,
                matchWinner,
            };
        }
        else {
            const matchWinnerTeam: Team =
                teams.reduce(
                    (best, current) =>
                        current.roundsWon > best.roundsWon || (current.roundsWon === best.roundsWon && current.totalTricksWon > best.totalTricksWon)
                            ? current
                            : best
                );
            console.log("\n===== MATCH RESULTS =====");
            teams.forEach(team => {
                console.log(`${team.name}: ${team.totalTricksWon} tricks`);
            });
            console.log(`\nMatch Winner Team: ${matchWinnerTeam.name}`);
            return {
                roundWinnerTeams,
                matchWinnerTeam,
            };
        }
    }
}