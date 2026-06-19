import { Player } from "../core/Player.js";
import { Team } from "../domain/team/Team.js";

export class TeamFactory {
    static createDefaultTeams(players: Player[]): Team[] {
        const p1 = players.find(p => p.id === "P1")!;
        const p2 = players.find(p => p.id === "P2")!;
        const p3 = players.find(p => p.id === "P3")!;
        const p4 = players.find(p => p.id === "P4")!;

        p1.teamId = "TEAM_A";
        p3.teamId = "TEAM_A";

        p2.teamId = "TEAM_B";
        p4.teamId = "TEAM_B";

        return [
            {
                id: "TEAM_A",
                name: "A",
                players: [p1, p3],
                tricksWonThisRound: 0,
                totalTricksWon: 0,
                roundsWon: 0
            },
            {
                id: "TEAM_B",
                name: "B",
                players: [p2, p4],
                tricksWonThisRound: 0,
                totalTricksWon: 0,
                roundsWon: 0
            }
        ];
    }
}