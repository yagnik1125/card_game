import { BotFactory } from "./BotFactory";
import { Player } from "../core/Player";

export class PlayerFactory {
    private static createStats() {
        return {
            tricksWonThisRound: 0,
            totalTricksWon: 0,
            roundsWon: 0,
            trumpDeclarations: 0,
            cardsPlayed: 0,
            gamesWon: 0
        };
    }
    static createPlayers(difficulty: | "easy" | "medium" | "hard"): Player[] {
        return [
            {
                id: "P1",
                name: "Player",
                hand: [],
                isBot: false,
                isConnected: true,
                stats: this.createStats()
            },
            {
                id: "P2",
                name: "Bot 1",
                hand: [],
                isBot: true,
                isConnected: true,
                strategy: BotFactory.create(difficulty),
                stats: this.createStats()
            },
            {
                id: "P3",
                name: "Bot 2",
                hand: [],
                isBot: true,
                isConnected: true,
                strategy: BotFactory.create(difficulty),
                stats: this.createStats()
            },
            {
                id: "P4",
                name: "Bot 3",
                hand: [],
                isBot: true,
                isConnected: true,
                strategy: BotFactory.create(difficulty),
                stats: this.createStats()
            }
        ];
    }
}