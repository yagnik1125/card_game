import { Player } from "../core/Player";
import { MoveGenerator } from "./MoveGenerator";
import { RoundState } from "./RoundState";
import { TrickFactory } from "./TrickFactory";
import { TrickEngine } from "./TrickEngine";
import { TurnManager } from "./TurnManager";
import { WinnerResolver } from "./WinnerResolver";
import {Card} from "../core/Card";

export class RoundEngine {
    static playRound(
        players: Player[],
        roundState: RoundState,
        leaderId: string
    ): string {
        let currentLeaderId = leaderId;
        for (let trickNumber = 1; trickNumber <= 13; trickNumber++) {
            const trick =TrickFactory.create(trickNumber);
            const playOrder =
                TurnManager.getPlayOrder(
                    players,
                    currentLeaderId
                );
            console.log(`\n========== Trick ${trickNumber} ==========`);
            for (const player of playOrder) {
                const legalCards =
                    MoveGenerator.getLegalCards(
                        player,
                        trick
                    );
                let card:Card;
                if (player.strategy) {
                    const decision = player.strategy!.chooseCard(
                            player,
                            legalCards,
                            trick,
                            roundState
                        );
                    card = decision.card;
                } else {
                    card = legalCards[0];
                }
                console.log(`${player.name} plays ${card.rank} ${card.suit}`);
                TrickEngine.playCard(
                    trick,
                    player,
                    card,
                    roundState
                );
            }
            const winningPlay =
                WinnerResolver.resolve(
                    trick,
                    roundState
                );
            trick.winnerId =winningPlay.playerId;
            const winnerPlayer =players.find(p => p.id === winningPlay.playerId)!;
            winnerPlayer.tricksWon++;
            winnerPlayer.totalTricksWon++;
            currentLeaderId =winnerPlayer.id;
            console.log(`Winner: ${winnerPlayer.name}`);
        }
        const champion =
            players.reduce(
                (best, current) =>
                    current.tricksWon >
                        best.tricksWon
                        ? current
                        : best
            );
        return champion.id;
    }
}
