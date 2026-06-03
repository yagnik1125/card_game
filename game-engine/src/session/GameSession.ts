import { GamePhase } from "../core/enums";
import { Match } from "../domain/match/Match";
import { GameEvent } from "../events/GameEvents";
import { GameState } from "./GameState";

export interface GameSession {
  gameId: string;
  match: Match;
  phase: GamePhase;
  currentPlayerId: string | null;
  gameState: GameState | null;
  events: GameEvent[];
}