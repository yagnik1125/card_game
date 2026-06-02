import { Card } from "../core/Card";
import { Player } from "../core/Player";
import { Trick } from "../game/Trick";
import { RoundState } from "../game/RoundState";
import { BotDecision } from "./BotDecision";

export interface BotStrategy {
  chooseCard(
    player: Player,
    legalCards: Card[],
    trick: Trick,
    roundState: RoundState
  ): BotDecision;
}