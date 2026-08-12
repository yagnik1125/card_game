import { describe, expect, it } from "vitest";
import { GameMode, Suit } from "../../../game-engine/src/core/enums.js";
import { TrickEngine } from "../../../game-engine/src/engines/TrickEngine.js";
import { TrumpResolver } from "../../../game-engine/src/rules/TrumpResolver.js";
import {
    makeCard,
    makePlayer,
    makeRoundState,
    makeTrick,
} from "../../helpers/engine.js";

describe("TrumpResolver — trump declaration rules", () => {
    it("trump can be declared only once per round", () => {
        const player = makePlayer("P2", [makeCard(Suit.SPADES, 2)]);
        const state = makeRoundState({ trumpDeclared: true });
        const canDeclare = TrumpResolver.shouldDeclareTrump(
            player,
            makeCard(Suit.SPADES, 2),
            Suit.HEARTS,
            state,
            GameMode.SOLO
        );
        expect(canDeclare).toBe(false);
    });

    it("a player without the lead suit can declare trump by playing a non-lead card", () => {
        const player = makePlayer("P2", [makeCard(Suit.SPADES, 2)]);
        const state = makeRoundState();
        const canDeclare = TrumpResolver.shouldDeclareTrump(
            player,
            makeCard(Suit.SPADES, 2),
            Suit.HEARTS,
            state,
            GameMode.SOLO
        );
        expect(canDeclare).toBe(true);
    });

    it("declaring means the played card itself becomes the trump suit", () => {
        const state = makeRoundState();
        TrumpResolver.declareTrump(makeCard(Suit.SPADES, 2), state);
        expect(state.trumpSuit).toBe(Suit.SPADES);
        expect(state.trumpDeclared).toBe(true);
    });

    it("SOLO champion (previous round winner) cannot declare from round 2 onward", () => {
        const champion = makePlayer("P2", [makeCard(Suit.SPADES, 2)]);
        const other = makePlayer("P3", [makeCard(Suit.SPADES, 2)]);
        const state = makeRoundState({ championPlayerId: "P2" });

        expect(
            TrumpResolver.shouldDeclareTrump(champion, makeCard(Suit.SPADES, 2), Suit.HEARTS, state, GameMode.SOLO)
        ).toBe(false);
        expect(
            TrumpResolver.shouldDeclareTrump(other, makeCard(Suit.SPADES, 2), Suit.HEARTS, state, GameMode.SOLO)
        ).toBe(true);
    });

    it("TEAMS_2V2 champion team cannot declare from round 2 onward", () => {
        const champion = makePlayer("P1", [makeCard(Suit.SPADES, 2)]);
        champion.teamId = "TEAM_A";
        const rival = makePlayer("P2", [makeCard(Suit.SPADES, 2)]);
        rival.teamId = "TEAM_B";
        const state = makeRoundState({ championTeamId: "TEAM_A" });

        expect(
            TrumpResolver.shouldDeclareTrump(champion, makeCard(Suit.SPADES, 2), Suit.HEARTS, state, GameMode.TEAMS_2V2)
        ).toBe(false);
        expect(
            TrumpResolver.shouldDeclareTrump(rival, makeCard(Suit.SPADES, 2), Suit.HEARTS, state, GameMode.TEAMS_2V2)
        ).toBe(true);
    });

    it("a player holding the lead suit cannot declare trump (must follow suit)", () => {
        const player = makePlayer("P2", [
            makeCard(Suit.HEARTS, 3),
            makeCard(Suit.SPADES, 2),
        ]);
        const state = makeRoundState();
        const canDeclare = TrumpResolver.shouldDeclareTrump(
            player,
            makeCard(Suit.SPADES, 2),
            Suit.HEARTS,
            state,
            GameMode.SOLO
        );
        expect(canDeclare).toBe(false);
    });

    it("TrickEngine records the trump card played in the trick and declares the suit", () => {
        const player = makePlayer("P2", [makeCard(Suit.SPADES, 2)]);
        const trick = makeTrick();
        trick.leadSuit = Suit.HEARTS;
        const state = makeRoundState();

        TrickEngine.playCard(
            trick,
            player,
            makeCard(Suit.SPADES, 2),
            state,
            GameMode.SOLO
        );

        expect(state.trumpSuit).toBe(Suit.SPADES);
        expect(state.trumpDeclared).toBe(true);
        expect(trick.plays).toHaveLength(1);
        expect(trick.plays[0].card.suit).toBe(Suit.SPADES);
    });
});
