import { EasyBot } from "../bots/strategies/EasyBot.js";
import { MediumBot } from "../bots/strategies/MediumBot.js";
import { HardBot } from "../bots/strategies/HardBot.js";

export class BotFactory {

  static create(
    difficulty:
      | "easy"
      | "medium"
      | "hard"
  ): EasyBot | MediumBot | HardBot {

    switch (difficulty) {

      case "easy":
        return new EasyBot();

      case "medium":
        return new MediumBot();

      case "hard":
        return new HardBot();

      default:
        return new EasyBot();
    }
  }
}