import { EasyBot } from "../bots/strategies/EasyBot";
import { MediumBot } from "../bots/strategies/MediumBot";
import { HardBot } from "../bots/strategies/HardBot";

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