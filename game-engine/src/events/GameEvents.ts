export type GameEventType =
  | "MATCH_STARTED"
  | "ROUND_STARTED"
  | "CARD_PLAYED"
  | "TRUMP_DECLARED"
  | "TRICK_COMPLETED"
  | "ROUND_COMPLETED"
  | "MATCH_COMPLETED";

export interface GameEvent {
  type: GameEventType;
  gameId: string;
  payload?: any;
}