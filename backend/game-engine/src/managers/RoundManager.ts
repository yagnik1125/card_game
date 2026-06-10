import { Player } from "../core/Player.js";

export class RoundManager {
  static determineWinner(
    players: Player[]
  ): Player {
    return players.reduce(
      (best, current) =>
        current.stats.tricksWonThisRound >
        best.stats.tricksWonThisRound
          ? current
          : best
    );
  }
}