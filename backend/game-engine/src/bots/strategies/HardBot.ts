import { Card } from "../../core/Card.js";
import { Player } from "../../core/Player.js";
import { BotStrategy } from "../BotStrategy.js";
import { BotDecision } from "../BotDecision.js";
import { RoundState } from "../../domain/round/RoundState.js";
import { Trick } from "../../domain/trick/Trick.js";
import { GameMode, Rank, Suit } from "../../core/enums.js";
import { PlayedCard } from "../../domain/trick/PlayedCard.js";

export class HardBot implements BotStrategy {
  chooseCard(
    player: Player,
    legalCards: Card[],
    trick: Trick,
    roundState: RoundState,
    mode: GameMode,
    players?: Player[]
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
    if (mode === GameMode.TEAMS_2V2 && players) {
      const winningPlayer: Player = players.find(p => p.id === currentWinner.playerId)!;
      const partnerWinning: boolean = winningPlayer && winningPlayer.teamId === player.teamId;
      if (partnerWinning) {
        const discard: Card = this.getBestDiscard(sorted, trump);
        return {
          card: discard
        };
      }
    }
    const winningCards: Card[] = sorted.filter(card => this.canBeat(card, currentWinner.card, trick.leadSuit!, trump));
    if (winningCards.length) {
      const nonTrumpWinner: Card | undefined = winningCards.find(c => c.suit !== trump);
      return {
        card: nonTrumpWinner ?? winningCards[0]
      };
    }
    const discard: Card = this.getBestDiscard(sorted, trump);

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

  private getBestDiscard(
    cards: Card[],
    trump: Suit | null
  ): Card {
    const nonTrumpLow = cards.filter(c => c.suit !== trump).sort((a, b) => a.rank - b.rank);
    if (nonTrumpLow.length) {
      return nonTrumpLow[0];
    }
    return cards[0];
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