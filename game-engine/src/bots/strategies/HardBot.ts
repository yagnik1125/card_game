import { Card } from "../../core/Card";
import { Player } from "../../core/Player";
import { BotStrategy } from "../BotStrategy";
import { BotDecision } from "../BotDecision";
import { RoundState } from "../../domain/round/RoundState";
import { Trick } from "../../domain/trick/Trick";
import { Suit } from "../../core/enums";

export class HardBot implements BotStrategy {
  chooseCard(
    player: Player,
    legalCards: Card[],
    trick: Trick,
    roundState: RoundState
  ): BotDecision {
    const trumpSuit = roundState.trumpSuit;
    if (!trick.leadSuit) {
      const sorted = [...legalCards].sort((a, b) => a.rank - b.rank);
      return {
        card: sorted[0]
      };
    }
    const currentWinningPlay = this.getCurrentWinningPlay(trick, trumpSuit);
    const winningCards = legalCards.filter(card =>
      this.canBeat(card, currentWinningPlay.card, trick.leadSuit!, trumpSuit)
    );
    if (winningCards.length > 0) {
      const cheapestWinningCard = winningCards.sort((a, b) => a.rank - b.rank)[0];
      return {
        card: cheapestWinningCard
      };
    }
    const lowestCard = [...legalCards].sort((a, b) => a.rank - b.rank)[0];
    return {
      card: lowestCard
    };
  }
  private getCurrentWinningPlay(trick: Trick, trumpSuit: Suit | null) {
    let winner = trick.plays[0];
    for (const play of trick.plays.slice(1)) {
      if (this.canBeat(play.card, winner.card, trick.leadSuit!, trumpSuit)) {
        winner = play;
      }
    }
    return winner;
  }
  private canBeat(
    challenger: Card,
    currentWinner: Card,
    leadSuit: Suit,
    trumpSuit: Suit | null
  ): boolean {
    if (trumpSuit && challenger.suit === trumpSuit && currentWinner.suit !== trumpSuit) {
      return true;
    }
    if (trumpSuit && challenger.suit !== trumpSuit && currentWinner.suit === trumpSuit) {
      return false;
    }
    if (challenger.suit === currentWinner.suit) {
      return (challenger.rank > currentWinner.rank);
    }
    if (challenger.suit === leadSuit && currentWinner.suit !== leadSuit) {
      return true;
    }
    return false;
  }
}