import { describe, expect, it } from "vitest";
import { Player } from "../../../game-engine/src/core/Player.js";
import { Team } from "../../../game-engine/src/domain/team/Team.js";
import { GameFlowService } from "../../../game-engine/src/services/GameFlowService.js";
import { makePlayer } from "../../helpers/engine.js";

function setStats(
    player: Player,
    roundsWon: number,
    totalTricksWon: number
): Player {
    player.stats.roundsWon = roundsWon;
    player.stats.totalTricksWon = totalTricksWon;
    return player;
}

function makeTeam(
    id: string,
    players: Player[],
    roundsWon: number,
    totalTricksWon: number
): Team {
    return {
        id,
        name: id,
        players,
        tricksWonThisRound: 0,
        totalTricksWon,
        roundsWon,
    };
}

describe("GameFlowService — match winner resolution (BUG-1 regression)", () => {
    it("SOLO: winner is decided by most rounds won, not most total tricks", () => {
        const players = [
            setStats(makePlayer("P1"), 1, 20),
            setStats(makePlayer("P2"), 2, 10),
        ];
        const winner = GameFlowService.resolveSoloMatchWinner(players);
        expect(winner.id).toBe("P2");
    });

    it("SOLO: tie on rounds won is broken by total tricks won", () => {
        const players = [
            setStats(makePlayer("P1"), 2, 10),
            setStats(makePlayer("P2"), 2, 15),
        ];
        const winner = GameFlowService.resolveSoloMatchWinner(players);
        expect(winner.id).toBe("P2");
    });

    it("TEAMS_2V2: winner is decided by most rounds won", () => {
        const teams = [
            makeTeam("TEAM_A", [makePlayer("P1")], 1, 30),
            makeTeam("TEAM_B", [makePlayer("P2")], 2, 12),
        ];
        const winner = GameFlowService.resolveTeamMatchWinner(teams);
        expect(winner.id).toBe("TEAM_B");
    });

    it("TEAMS_2V2: tie on rounds won is broken by total tricks won", () => {
        const teams = [
            makeTeam("TEAM_A", [makePlayer("P1")], 2, 12),
            makeTeam("TEAM_B", [makePlayer("P2")], 2, 20),
        ];
        const winner = GameFlowService.resolveTeamMatchWinner(teams);
        expect(winner.id).toBe("TEAM_B");
    });
});
