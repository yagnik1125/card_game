import { EasyBot } from "./EasyBot";
import { MediumBot } from "./MediumBot";
import { HardBot } from "./HardBot";

export class BotFactory {

  static create(
    difficulty:
      | "easy"
      | "medium"
      | "hard"
  ) {

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