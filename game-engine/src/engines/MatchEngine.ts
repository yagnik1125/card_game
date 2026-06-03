import { RoundEngine } from "./RoundEngine";
import { PlayerFactory } from "../factories/PlayerFactory";
import { DeckManager } from "../managers/DeckManager";
import { PlayerManager } from "../managers/PlayerManager";
import { RoundState } from "../domain/round/RoundState";

export class MatchEngine {
    static playMatch() {
        let previousChampionId: string | null = null;
        const roundWinners: string[] = [];
        const players =PlayerFactory.createPlayers();
        for (let roundNumber = 1; roundNumber <= 5; roundNumber++) {
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
            const championId =
                RoundEngine.playRound(
                    players,
                    roundState,
                    "P1"
                );
            roundWinners.push(championId);
            previousChampionId =championId;
            console.log(`Round ${roundNumber} Champion: ${championId}`);
        }
        const matchWinner =
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