import { Player } from "../core/Player";

export class PlayerManager {
    static resetRoundStats(
        players: Player[]
    ) {
        players.forEach(player => {
            player.tricksWon = 0;
        });
    }
    static clearHands(
        players: Player[]
    ) {
        players.forEach(player => {
            player.hand = [];
        });
    }
}