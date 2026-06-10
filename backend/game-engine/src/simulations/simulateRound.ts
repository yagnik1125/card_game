import { PlayerFactory } from "../factories/PlayerFactory.js";
import { RoundEngine } from "../engines/RoundEngine.js";
import { RoundState } from "../domain/round/RoundState.js";
import { Player } from "../core/Player.js";

const players: Player[] =
  PlayerFactory.createPlayers("hard");

const roundState: RoundState = {
  roundNumber: 1,
  trumpSuit: null,
  championPlayerId: null,
  trumpDeclared: false,
};

const championId: string =
  RoundEngine.playRound(
    players,
    roundState,
    "P1"
  );

console.log("\n===== FINAL =====");

players.forEach(player => {
  console.log(
    player.name,
    player.stats.tricksWonThisRound
  );
});

console.log(
  "\nRound Champion:",
  championId
);