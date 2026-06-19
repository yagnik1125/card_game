import { Card } from "../../core/Card.js";
import { Player } from "../../core/Player.js";
import { BotStrategy } from "../BotStrategy.js";
import { BotDecision } from "../BotDecision.js";
import { RoundState } from "../../domain/round/RoundState.js";
import { Trick } from "../../domain/trick/Trick.js";
import { GameMode, Suit } from "../../core/enums.js";
import { PlayedCard } from "../../domain/index.js";

export class MediumBot
  implements BotStrategy {
  chooseCard(
    player: Player,
    legalCards: Card[],
    trick: Trick,
    roundState: RoundState,
    mode: GameMode,
    players?: Player[]
  ): BotDecision {
    const sorted: Card[] = [...legalCards].sort((a, b) => a.rank - b.rank);
    if (trick.plays.length === 0) {
      return {
        card: sorted[0]
      };
    }

    let winningCard: Card = trick.plays[0].card;
    let winningPlayerId: string = trick.plays[0].playerId;
    for (const play of trick.plays) {
      const card: Card = play.card;
      const currentTrump: boolean = card.suit === roundState.trumpSuit;
      const winningTrump: boolean = winningCard.suit === roundState.trumpSuit;
      if (currentTrump && !winningTrump) {
        winningCard = card;
        winningPlayerId = play.playerId;
        continue;
      }
      if (card.suit === winningCard.suit && card.rank > winningCard.rank) {
        winningCard = card;
        winningPlayerId = play.playerId;
      }
    }

    if (mode === GameMode.TEAMS_2V2 && player.teamId && players) {
      const partnerPlay: PlayedCard = trick.plays.find(play => {
        if (play.playerId === player.id) {
          return false;
        }
        const playPlayer = players.find(p => p.id === play.playerId);
        return playPlayer?.teamId === player.teamId;
      })!;
      if (partnerPlay && partnerPlay.playerId === winningPlayerId) {
        const safeCards: Card[] = sorted.filter(
          card => !this.beats(card, winningCard, roundState.trumpSuit)
        );
        return {
          card: safeCards.length > 0 ? safeCards[0] : sorted[0]
        };
      }
    }

    const winningCards: Card[] = sorted.filter(
      card => this.beats(card, winningCard, roundState.trumpSuit)
    );
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
    if (candidateTrump && !winnerTrump) {
      return true;
    }
    if (!candidateTrump && winnerTrump) {
      return false;
    }
    if (candidate.suit === currentWinner.suit) {
      return candidate.rank > currentWinner.rank;
    }
    return false;
  }
}