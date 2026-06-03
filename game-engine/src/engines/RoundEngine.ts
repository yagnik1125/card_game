import { Player } from "../core/Player";
import { TrickFactory } from "../factories/TrickFactory";
import { TrickEngine } from "./TrickEngine";
import { TurnManager } from "../managers/TurnManager";
import { WinnerResolver } from "../rules/WinnerResolver";
import {Card} from "../core/Card";
import { RoundState } from "../domain/round/RoundState";
import { LegalMoveGenerator } from "../rules/LegalMoveGenerator";

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
                    LegalMoveGenerator.getLegalCards(
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
            trick.winnerPlayerId =winningPlay.playerId;
            const winnerPlayer =players.find(p => p.id === winningPlay.playerId)!;
            winnerPlayer.stats.tricksWonThisRound++;
            winnerPlayer.stats.totalTricksWon++;
            currentLeaderId =winnerPlayer.id;
            console.log(`Winner: ${winnerPlayer.name}`);
        }
        const champion =
            players.reduce(
                (best, current) =>
                    current.stats.tricksWonThisRound >
                        best.stats.tricksWonThisRound
                        ? current
                        : best
            );
        return champion.id;
    }
}
