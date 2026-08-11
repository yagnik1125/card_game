import { describe, expect, it } from "vitest";
import { Suit } from "../../../game-engine/src/core/enums.js";
import { Trick } from "../../../game-engine/src/domain/trick/Trick.js";
import { WinnerResolver } from "../../../game-engine/src/rules/WinnerResolver.js";
import { makeCard, makeRoundState } from "../../helpers/engine.js";

interface PlayInput {
    playerId: string;
    suit: Suit;
    rank: number;
}

function trickWith(
    leadSuit: Suit,
    plays: PlayInput[]
): Trick {
    return {
        id: "trick-test",
        trickNumber: 1,
        leadSuit,
        plays: plays.map((p) => ({
            playerId: p.playerId,
            card: makeCard(p.suit, p.rank),
        })),
        winnerPlayerId: null,
    };
}

describe("WinnerResolver — trick rules", () => {
    it("higher card of the lead suit wins", () => {
        const trick = trickWith(Suit.HEARTS, [
            { playerId: "P1", suit: Suit.HEARTS, rank: 5 },
            { playerId: "P2", suit: Suit.HEARTS, rank: 9 },
        ]);
        const winner = WinnerResolver.resolve(trick, makeRoundState());
        expect(winner.playerId).toBe("P2");
    });

    it("trump beats the lead suit even when lower ranked", () => {
        const trick = trickWith(Suit.HEARTS, [
            { playerId: "P1", suit: Suit.HEARTS, rank: 14 },
            { playerId: "P2", suit: Suit.SPADES, rank: 2 },
        ]);
        const winner = WinnerResolver.resolve(
            trick,
            makeRoundState({ trumpSuit: Suit.SPADES })
        );
        expect(winner.playerId).toBe("P2");
    });

    it("higher trump beats lower trump", () => {
        const trick = trickWith(Suit.HEARTS, [
            { playerId: "P1", suit: Suit.HEARTS, rank: 5 },
            { playerId: "P2", suit: Suit.SPADES, rank: 2 },
            { playerId: "P3", suit: Suit.SPADES, rank: 10 },
        ]);
        const winner = WinnerResolver.resolve(
            trick,
            makeRoundState({ trumpSuit: Suit.SPADES })
        );
        expect(winner.playerId).toBe("P3");
    });

    it("off-suit non-trump cards cannot win", () => {
        const trick = trickWith(Suit.HEARTS, [
            { playerId: "P1", suit: Suit.HEARTS, rank: 5 },
            { playerId: "P2", suit: Suit.CLUBS, rank: 14 },
        ]);
        const winner = WinnerResolver.resolve(trick, makeRoundState());
        expect(winner.playerId).toBe("P1");
    });

    it("trump is evaluated even when a higher lead card exists", () => {
        const trick = trickWith(Suit.CLUBS, [
            { playerId: "P1", suit: Suit.CLUBS, rank: 14 },
            { playerId: "P2", suit: Suit.DIAMONDS, rank: 3 },
            { playerId: "P3", suit: Suit.DIAMONDS, rank: 11 },
        ]);
        const winner = WinnerResolver.resolve(
            trick,
            makeRoundState({ trumpSuit: Suit.DIAMONDS })
        );
        expect(winner.playerId).toBe("P3");
    });
});
