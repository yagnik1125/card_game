import { BotStrategy } from "../bots/BotStrategy";
import { Card } from "./Card";

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  tricksWon: number;
  totalTricksWon: number;
  strategy?: BotStrategy;
}