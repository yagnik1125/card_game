import { Player } from "../core/Player";

export class TurnManager {
  static getPlayOrder(
    players: Player[],
    leaderId: string
  ): Player[] {
    const leaderIndex =players.findIndex(p => p.id === leaderId);
    const order: Player[] = [];
    for (let i = 0; i < players.length; i++) {
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