import { RoundEngine } from "./RoundEngine.js";
import { PlayerFactory } from "../factories/PlayerFactory.js";
import { DeckManager } from "../managers/DeckManager.js";
import { PlayerManager } from "../managers/PlayerManager.js";
import { RoundState } from "../domain/round/RoundState.js";
import { Player } from "../core/Player.js";

export class MatchEngine {
    static playMatch() {
        let previousChampionId: string | null = null;
        const roundWinners: string[] = [];
        const players: Player[] = PlayerFactory.createPlayers("hard");
        for (let roundNumber: number = 1; roundNumber <= 5; roundNumber++) {
            console.log(`\n================ ROUND ${roundNumber} ================`);
            PlayerManager.resetRoundStats(players);
            PlayerManager.clearHands(players);
            DeckManager.dealCards(players);
            const roundState: RoundState = {
                roundNumber,
                trumpSuit: null,
                championPlayerId: previousChampionId,
                trumpDeclared: false,
            };
            const championId: string =
                RoundEngine.playRound(
                    players,
                    roundState,
                    "P1"
                );
            roundWinners.push(championId);
            previousChampionId = championId;
            console.log(`Round ${roundNumber} Champion: ${championId}`);
        }
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
}