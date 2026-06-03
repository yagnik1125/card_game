import { Player } from "../../core/Player";
import { Round } from "../round/Round";
import { MatchResult } from "./MatchResult";
import { MatchState } from "./MatchState";

export interface Match {
    id: string;
    players: Player[];
    rounds: Round[];
    state: MatchState;
    result: MatchResult | null;
}