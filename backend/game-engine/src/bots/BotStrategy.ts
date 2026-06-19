import { Card } from "../core/Card.js";
import { GameMode } from "../core/enums.js";
import { Player } from "../core/Player.js";
import { RoundState } from "../domain/round/RoundState.js";
import { Trick } from "../domain/trick/Trick.js";
import { BotDecision } from "./BotDecision.js";

export interface BotStrategy {
  chooseCard(
    player: Player,
    legalCards: Card[],
    trick: Trick,
    roundState: RoundState,
    mode: GameMode,
    players?: Player[]
  ): BotDecision;
}