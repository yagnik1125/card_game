import { Player } from "../core/Player.js";
import { Team } from "../domain/team/Team.js";

export class TeamManager {
    static resetRoundStats(teams: Team[]): void {
        teams.forEach(team => {
            team.tricksWonThisRound = 0;
            team.players.forEach(player => {
                player.stats.tricksWonThisRound = 0;
                player.hand = [];
            });
        });
    }
    static resetMatchStats(teams: Team[]): void {
        teams.forEach(team => {
            team.tricksWonThisRound = 0;
            team.totalTricksWon = 0;
            team.roundsWon = 0;
            team.players.forEach(player => {
                player.stats.tricksWonThisRound = 0;
                player.stats.totalTricksWon = 0;
                player.stats.roundsWon = 0;
                player.stats.trumpDeclarations = 0;
                player.stats.cardsPlayed = 0;
            });
        });
    }
}