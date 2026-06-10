import { GamePhase } from "../core/enums.js";
import { Match } from "../domain/match/Match.js";
import { GameEvent } from "../events/GameEvents.js";
import { GameState } from "./GameState.js";

export interface GameSession {
  gameId: string;
  match: Match;
  phase: GamePhase;
  currentPlayerId: string | null;
  gameState: GameState | null;
  events: GameEvent[];
}