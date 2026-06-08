import { Card } from "../../core/Card";
import { Player } from "../../core/Player";
import { BotStrategy } from "../BotStrategy";
import { BotDecision } from "../BotDecision";
import { RoundState } from "../../domain/round/RoundState";
import { Trick } from "../../domain/trick/Trick";
import { Suit } from "../../core/enums";

export class MediumBot
  implements BotStrategy {
  chooseCard(
    player: Player,
    legalCards: Card[],
    trick: Trick,
    roundState: RoundState
  ): BotDecision {
    const sorted: Card[] = [...legalCards].sort((a, b) => a.rank - b.rank);
    if (trick.plays.length === 0) {
      return {
        card: sorted[0]
      };
    }
    let winningCard: Card = trick.plays[0].card;
    for (const play of trick.plays) {
      const card: Card = play.card;
      const currentTrump: boolean = card.suit === roundState.trumpSuit;
      const winningTrump: boolean = winningCard.suit === roundState.trumpSuit;
      if (currentTrump && !winningTrump) {
        winningCard = card;
        continue;
      }
      if (card.suit === winningCard.suit && card.rank > winningCard.rank) {
        winningCard = card;
      }
    }
    // Find smallest card capable of beating winner
    const winningCards: Card[] = sorted.filter(
      card => this.beats(card, winningCard, roundState.trumpSuit)
    );
    // play minimum winning card
    if (winningCards.length > 0) {
      return {
        card: winningCards[0]
      };
    }
    return {
      card: sorted[0]
    };
  }

  private beats(
    candidate: Card,
    currentWinner: Card,
    trumpSuit: Suit | null
  ): boolean {
    const candidateTrump: boolean | null = trumpSuit && candidate.suit === trumpSuit;
    const winnerTrump: boolean | null = trumpSuit && currentWinner.suit === trumpSuit;
    // trump beats non trump
    if (candidateTrump && !winnerTrump) {
      return true;
    }
    if (!candidateTrump && winnerTrump) {
      return false;
    }
    // same suit
    if (candidate.suit === currentWinner.suit) {
      return (
        candidate.rank >
        currentWinner.rank
      );
    }
    return false;
  }
}