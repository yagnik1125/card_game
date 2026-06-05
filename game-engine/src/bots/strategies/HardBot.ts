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
    const trump = roundState.trumpSuit;
    const sorted = [...legalCards].sort((a, b) => this.cardValue(a, trump) - this.cardValue(b, trump));
    if (trick.plays.length === 0) {
      const nonTrumpHigh = sorted.filter(c => c.suit !== trump && c.rank >= 11).sort((a, b) => b.rank - a.rank);
      if (nonTrumpHigh.length) {
        return {
          card: nonTrumpHigh[0]
        };
      }
      return {
        card: sorted[0]
      };
    }
    const currentWinner = this.getCurrentWinner(trick, trump);
    const winners = sorted.filter(card => this.canBeat(card, currentWinner.card, trick.leadSuit!, trump));
    if (winners.length) {
      const nonTrumpWinner = winners.find(c => c.suit !== trump);
      return {
        card: nonTrumpWinner ?? winners[0]
      };
    }
    const discard = sorted.filter(c => c.suit !== trump && c.rank < 11).sort((a, b) => a.rank - b.rank)[0];

    return {
      card: discard ?? sorted[0]
    };
  }

  private cardValue(
    card: Card,
    trump: Suit | null
  ) {
    let value = card.rank;
    if (trump && card.suit === trump) {
      value += 100;
    }
    return value;
  }

  private getCurrentWinner(
    trick: Trick,
    trump: Suit | null
  ) {
    let winner = trick.plays[0];
    for (const play of trick.plays.slice(1)) {
      if (this.canBeat(play.card, winner.card, trick.leadSuit!, trump)) {
        winner = play;
      }
    }
    return winner;
  }

  private canBeat(
    challenger: Card,
    winner: Card,
    leadSuit: Suit,
    trump: Suit | null
  ) {
    const challengerTrump = challenger.suit === trump;
    const winnerTrump = winner.suit === trump;
    if (challengerTrump && !winnerTrump) {
      return true;
    }
    if (!challengerTrump && winnerTrump) {
      return false;
    }
    if (challenger.suit === winner.suit) {
      return (
        challenger.rank >
        winner.rank
      );
    }
    if (challenger.suit === leadSuit && winner.suit !== leadSuit) {
      return true;
    }
    return false;
  }
}