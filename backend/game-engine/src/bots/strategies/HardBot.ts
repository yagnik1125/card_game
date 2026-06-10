import { Card } from "../../core/Card.js";
import { Player } from "../../core/Player.js";
import { BotStrategy } from "../BotStrategy.js";
import { BotDecision } from "../BotDecision.js";
import { RoundState } from "../../domain/round/RoundState.js";
import { Trick } from "../../domain/trick/Trick.js";
import { Rank, Suit } from "../../core/enums.js";
import { PlayedCard } from "../../domain/trick/PlayedCard.js";

export class HardBot implements BotStrategy {
  chooseCard(
    player: Player,
    legalCards: Card[],
    trick: Trick,
    roundState: RoundState
  ): BotDecision {
    const trump: Suit | null = roundState.trumpSuit;
    const sorted: Card[] = [...legalCards].sort((a, b) => this.cardValue(a, trump) - this.cardValue(b, trump));
    if (trick.plays.length === 0) {
      const nonTrumpHigh: Card[] = sorted.filter(c => c.suit !== trump && c.rank >= 11).sort((a, b) => b.rank - a.rank);
      if (nonTrumpHigh.length) {
        return {
          card: nonTrumpHigh[0]
        };
      }
      return {
        card: sorted[0]
      };
    }
    const currentWinner: PlayedCard = this.getCurrentWinner(trick, trump);
    const winners: Card[] = sorted.filter(card => this.canBeat(card, currentWinner.card, trick.leadSuit!, trump));
    if (winners.length) {
      const nonTrumpWinner: Card | undefined = winners.find(c => c.suit !== trump);
      return {
        card: nonTrumpWinner ?? winners[0]
      };
    }
    const discard: Card = sorted.filter(c => c.suit !== trump && c.rank < 11).sort((a, b) => a.rank - b.rank)[0];

    return {
      card: discard ?? sorted[0]
    };
  }

  private cardValue(
    card: Card,
    trump: Suit | null
  ): Rank {
    let value: Rank = card.rank;
    if (trump && card.suit === trump) {
      value += 100;
    }
    return value;
  }

  private getCurrentWinner(
    trick: Trick,
    trump: Suit | null
  ): PlayedCard {
    let winner: PlayedCard = trick.plays[0];
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
  ): boolean {
    const challengerTrump: boolean = challenger.suit === trump;
    const winnerTrump: boolean = winner.suit === trump;
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