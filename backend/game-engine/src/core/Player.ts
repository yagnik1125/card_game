import { BotStrategy } from "../bots/BotStrategy.js";
import { PlayerStats } from "../domain/player/PlayerStats.js";
import { Card } from "./Card.js";

export interface Player {
  id: string;
  teamId?: string;
  name: string;
  hand: Card[];
  isBot: boolean;
  isConnected: boolean;
  strategy?: BotStrategy;
  stats: PlayerStats;
}