import { Card } from "../core/Card";
import { Player } from "../core/Player";
import { RoundState } from "../domain/round/RoundState";
import { Trick } from "../domain/trick/Trick";
import { BotDecision } from "./BotDecision";

export interface BotStrategy {
  chooseCard(
    player: Player,
    legalCards: Card[],
    trick: Trick,
    roundState: RoundState
  ): BotDecision;
}