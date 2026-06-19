import { GameMode } from "../core/enums.js";
import { MatchEngine } from "../engines/MatchEngine.js";

const result =
  MatchEngine.playMatch(GameMode.TEAMS_2V2);

console.log(result);
// npx tsx .\game-engine\src\simulations\simulateMatch.ts