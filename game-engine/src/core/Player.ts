import { BotStrategy } from "../bots/BotStrategy";
import { PlayerStats } from "../domain/player/PlayerStats";
import { Card } from "./Card";

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  isBot: boolean;
  isConnected: boolean;
  strategy?: BotStrategy;
  stats: PlayerStats;
}