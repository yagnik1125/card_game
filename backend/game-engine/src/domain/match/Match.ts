import { Player } from "../../core/Player.js";
import { Round } from "../round/Round.js";
import { MatchResult } from "./MatchResult.js";
import { MatchState } from "./MatchState.js";

export interface Match {
    id: string;
    players: Player[];
    rounds: Round[];
    state: MatchState;
    result: MatchResult | null;
}