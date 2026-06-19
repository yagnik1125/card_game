import { PlayerFactory } from "../factories/PlayerFactory.js";
import { RoundEngine } from "../engines/RoundEngine.js";
import { RoundState } from "../domain/round/RoundState.js";
import { Player } from "../core/Player.js";
import { Team } from "../domain/index.js";
import { TeamFactory } from "../factories/TeamFactory.js";
import { GameMode } from "../core/enums.js";

const players: Player[] =
  PlayerFactory.createPlayers("hard");
const teams: Team[] = TeamFactory.createDefaultTeams(players);

const roundState: RoundState = {
  roundNumber: 1,
  trumpSuit: null,
  championPlayerId: null,
  championTeamId: null,
  trumpDeclared: false,
};

const championId: string =
  RoundEngine.playRound(
    players,
    roundState,
    "P1",
    teams,
    GameMode.TEAMS_2V2
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