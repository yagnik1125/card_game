import { BotFactory } from "../bots/BotFactory";
import { Player } from "../core/Player";

export class PlayerFactory {

  static createPlayers(): Player[] {

    return [
      {
        id: "P1",
        name: "Player",
        hand: [],
        tricksWon: 0,
        totalTricksWon: 0,
        // strategy: BotFactory.create("medium")
      },
      {
        id: "P2",
        name: "Bot 1",
        hand: [],
        tricksWon: 0,
        totalTricksWon: 0,
        strategy: BotFactory.create("easy")
      },
      {
        id: "P3",
        name: "Bot 2",
        hand: [],
        tricksWon: 0,
        totalTricksWon: 0,
        strategy: BotFactory.create("medium")
      },
      {
        id: "P4",
        name: "Bot 3",
        hand: [],
        tricksWon: 0,
        totalTricksWon: 0,
        strategy: BotFactory.create("hard")
      }
    ];
  }
}