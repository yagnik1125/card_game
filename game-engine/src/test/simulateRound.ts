import { PlayerFactory } from "../game/PlayerFactory";
import { RoundEngine } from "../game/RoundEngine";
import { RoundState } from "../game/RoundState";

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
    player.tricksWon
  );
});

console.log(
  "\nRound Champion:",
  championId
);