import { Player } from "../../core/Player.js";

export interface Team {
    id: string;
    name: string;
    players: Player[];
    tricksWonThisRound: number;
    totalTricksWon: number;
    roundsWon: number;
}