import { Player } from "../core/Player.js";

export class PlayerManager {
    static resetRoundStats(players: Player[]): void {
        players.forEach(player => { player.stats.tricksWonThisRound = 0; });
    }
    static clearHands(players: Player[]): void {
        players.forEach(player => { player.hand = []; });
    }
    static resetMatchStats(players: Player[]): void {
        players.forEach(player => {
            player.stats.tricksWonThisRound = 0;
            player.stats.totalTricksWon = 0;
            player.stats.roundsWon = 0;
            player.stats.trumpDeclarations = 0;
            player.stats.cardsPlayed = 0;
        });
    }
}