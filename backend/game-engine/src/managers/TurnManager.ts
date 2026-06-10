import { Player } from "../core/Player.js";

export class TurnManager {
  static getPlayOrder(
    players: Player[],
    leaderId: string
  ): Player[] {
    const leaderIndex: number = players.findIndex(p => p.id === leaderId);
    const order: Player[] = [];
    for (let i: number = 0; i < players.length; i++) {
      order.push(
        players[
        (leaderIndex + i)
        % players.length
        ]
      );
    }
    return order;
  }
}