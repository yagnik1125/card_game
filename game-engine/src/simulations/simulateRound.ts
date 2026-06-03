import { PlayerFactory } from "../factories/PlayerFactory";
import { RoundEngine } from "../engines/RoundEngine";
import { RoundState } from "../domain/round/RoundState";

const players =
  PlayerFactory.createPlayers();

const roundState: RoundState = {
  roundNumber: 1,
  trumpSuit: null,
  championPlayerId: null,
  trumpDeclared: false,
};

const championId =
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