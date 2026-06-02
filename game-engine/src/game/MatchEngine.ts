import { RoundEngine } from "./RoundEngine";
import { RoundState } from "./RoundState";
import { PlayerFactory } from "./PlayerFactory";
import { DeckManager } from "./DeckManager";
import { PlayerManager } from "./PlayerManager";

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
                    current.totalTricksWon >
                        best.totalTricksWon
                        ? current
                        : best
            );
        console.log("\n===== MATCH RESULTS =====");
        players.forEach(player => {
            console.log(`${player.name}: ${player.totalTricksWon} tricks`);
        });
        console.log(`\nMatch Winner: ${matchWinner.name}`);
        return {
            roundWinners,
            matchWinner,
        };
    }
}