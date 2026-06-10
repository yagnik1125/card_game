import { Player } from "../core/Player.js";
import { TrickFactory } from "../factories/TrickFactory.js";
import { TrickEngine } from "./TrickEngine.js";
import { TurnManager } from "../managers/TurnManager.js";
import { WinnerResolver } from "../rules/WinnerResolver.js";
import { Card } from "../core/Card.js";
import { RoundState } from "../domain/round/RoundState.js";
import { LegalMoveGenerator } from "../rules/LegalMoveGenerator.js";
import { Trick } from "../domain/trick/Trick.js";
import { BotDecision } from "../bots/BotDecision.js";
import { PlayedCard } from "../domain/trick/PlayedCard.js";

export class RoundEngine {
    static playRound(
        players: Player[],
        roundState: RoundState,
        leaderId: string
    ): string {
        let currentLeaderId: string = leaderId;
        for (let trickNumber: number = 1; trickNumber <= 13; trickNumber++) {
            const trick: Trick = TrickFactory.create(trickNumber);
            const playOrder: Player[] =
                TurnManager.getPlayOrder(
                    players,
                    currentLeaderId
                );
            console.log(`\n========== Trick ${trickNumber} ==========`);
            for (const player of playOrder) {
                const legalCards: Card[] =
                    LegalMoveGenerator.getLegalCards(
                        player,
                        trick
                    );
                let card: Card;
                if (player.strategy) {
                    const decision: BotDecision = player.strategy!.chooseCard(
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
            const winningPlay: PlayedCard =
                WinnerResolver.resolve(
                    trick,
                    roundState
                );
            trick.winnerPlayerId = winningPlay.playerId;
            const winnerPlayer: Player = players.find(p => p.id === winningPlay.playerId)!;
            winnerPlayer.stats.tricksWonThisRound++;
            winnerPlayer.stats.totalTricksWon++;
            currentLeaderId = winnerPlayer.id;
            console.log(`Winner: ${winnerPlayer.name}`);
        }
        const champion: Player =
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
