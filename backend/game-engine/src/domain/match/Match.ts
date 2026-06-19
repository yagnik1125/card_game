import { GameMode } from "../../core/enums.js";
import { Player } from "../../core/Player.js";
import { Round } from "../round/Round.js";
import { Team } from "../team/Team.js";
import { MatchResult } from "./MatchResult.js";
import { MatchState } from "./MatchState.js";

export interface Match {
    id: string;
    players: Player[];
    teams: Team[];
    mode: GameMode;
    rounds: Round[];
    state: MatchState;
    result: MatchResult | null;
}