import { describe, expect, it } from "vitest";
import { Player } from "../../../game-engine/src/core/Player.js";
import { RoundLifecycleService } from "../../../game-engine/src/services/RoundLifecycleService.js";
import { TeamFactory } from "../../../game-engine/src/factories/TeamFactory.js";
import { makeCard, makePlayer } from "../../helpers/engine.js";
import { Suit } from "../../../game-engine/src/core/enums.js";

describe("RoundLifecycleService — round start", () => {
    it("deals exactly 13 cards to each player", () => {
        const players = [
            makePlayer("P1", [makeCard(Suit.HEARTS, 2)]),
            makePlayer("P2", [makeCard(Suit.HEARTS, 3)]),
            makePlayer("P3", [makeCard(Suit.HEARTS, 4)]),
            makePlayer("P4", [makeCard(Suit.HEARTS, 5)]),
        ];
        const { round, firstTrick } = RoundLifecycleService.startRound(players, [], 1, null, null);

        players.forEach((player) => expect(player.hand).toHaveLength(13));
        expect(round.state.roundNumber).toBe(1);
        expect(firstTrick.trickNumber).toBe(1);
        expect(firstTrick.plays).toHaveLength(0);
    });

    it("resets round stats between rounds", () => {
        const players = [
            makePlayer("P1"),
            makePlayer("P2"),
            makePlayer("P3"),
            makePlayer("P4"),
        ];
        players.forEach((player) => {
            player.stats.tricksWonThisRound = 7;
            player.stats.cardsPlayed = 13;
        });
        RoundLifecycleService.startRound(players, [], 2, "P3", null);
        players.forEach((player) => {
            expect(player.stats.tricksWonThisRound).toBe(0);
        });
    });

    it("carries the previous round winner as champion for the new round (SOLO)", () => {
        const players = [
            makePlayer("P1"),
            makePlayer("P2"),
            makePlayer("P3"),
            makePlayer("P4"),
        ];
        const { round } = RoundLifecycleService.startRound(players, [], 2, "P3", null);
        expect(round.state.championPlayerId).toBe("P3");
        expect(round.state.championTeamId).toBeNull();
    });

    it("carries the previous round winning team as champion team (TEAMS_2V2)", () => {
        const players = [
            makePlayer("P1"),
            makePlayer("P2"),
            makePlayer("P3"),
            makePlayer("P4"),
        ];
        const teams = TeamFactory.createDefaultTeams(players);
        const { round } = RoundLifecycleService.startRound(players, teams, 2, null, "TEAM_A");
        expect(round.state.championTeamId).toBe("TEAM_A");
    });
});
