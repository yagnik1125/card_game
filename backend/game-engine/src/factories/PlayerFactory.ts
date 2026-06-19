import { BotFactory } from "./BotFactory.js";
import { Player } from "../core/Player.js";
import { PlayerStats } from "../domain/player/PlayerStats.js";

export class PlayerFactory {
    private static createStats(): PlayerStats {
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
    static createPlayer(difficulty: | "easy" | "medium" | "hard", id: string): Player {
        return {
            id: id,
            name: "Bot 3",
            hand: [],
            isBot: true,
            isConnected: true,
            strategy: BotFactory.create(difficulty),
            stats: this.createStats()
        };
    }
    static createHuman(): Player {
        return {
            id: "P1",
            name: "Player",
            hand: [],
            isBot: false,
            isConnected: true,
            stats: this.createStats()
        };
    }
}