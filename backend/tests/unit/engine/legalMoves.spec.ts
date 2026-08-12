import { describe, expect, it } from "vitest";
import { Suit } from "../../../game-engine/src/core/enums.js";
import { LegalMoveGenerator } from "../../../game-engine/src/rules/LegalMoveGenerator.js";
import {
    makeCard,
    makePlayer,
    makeTrick,
} from "../../helpers/engine.js";

describe("LegalMoveGenerator — legal moves", () => {
    it("any card is legal when there is no lead suit yet", () => {
        const player = makePlayer("P1", [
            makeCard(Suit.HEARTS, 2),
            makeCard(Suit.CLUBS, 5),
            makeCard(Suit.SPADES, 9),
        ]);
        const trick = makeTrick();

        const legal = LegalMoveGenerator.getLegalCards(player, trick);
        expect(legal).toHaveLength(3);
    });

    it("only lead-suit cards are legal when the player holds the lead suit", () => {
        const player = makePlayer("P1", [
            makeCard(Suit.HEARTS, 2),
            makeCard(Suit.CLUBS, 5),
            makeCard(Suit.HEARTS, 9),
        ]);
        const trick = makeTrick();
        trick.leadSuit = Suit.HEARTS;

        const legal = LegalMoveGenerator.getLegalCards(player, trick);
        expect(legal).toHaveLength(2);
        legal.forEach((card) => expect(card.suit).toBe(Suit.HEARTS));
    });

    it("all cards are legal when the player does not hold the lead suit", () => {
        const player = makePlayer("P1", [
            makeCard(Suit.CLUBS, 2),
            makeCard(Suit.SPADES, 5),
        ]);
        const trick = makeTrick();
        trick.leadSuit = Suit.HEARTS;

        const legal = LegalMoveGenerator.getLegalCards(player, trick);
        expect(legal).toHaveLength(2);
    });

    it("cards already played are removed from the player hand and cannot be played again", () => {
        const player = makePlayer("P1", [
            makeCard(Suit.HEARTS, 2, "h2"),
            makeCard(Suit.HEARTS, 9, "h9"),
        ]);
        const trick = makeTrick();
        trick.leadSuit = Suit.HEARTS;
        player.hand = player.hand.filter((c) => c.id !== "h2");

        const legal = LegalMoveGenerator.getLegalCards(player, trick);
        expect(legal).toHaveLength(1);
        expect(legal[0].id).toBe("h9");
    });
});
