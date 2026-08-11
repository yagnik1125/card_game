import {
    HUMAN_PLAYER_ID,
    rankText,
    suitMap,
    suitOrder,
} from "@/utils/constants";

describe("rankText", () => {
    it("maps face cards and ace", () => {
        expect(rankText(11)).toBe("J");
        expect(rankText(12)).toBe("Q");
        expect(rankText(13)).toBe("K");
        expect(rankText(14)).toBe("A");
    });

    it("maps numeric ranks to strings", () => {
        expect(rankText(2)).toBe("2");
        expect(rankText(10)).toBe("10");
    });
});

describe("suitMap", () => {
    it("maps all four suits to symbols", () => {
        expect(suitMap.HEARTS).toBe("♥️");
        expect(suitMap.DIAMONDS).toBe("♦️");
        expect(suitMap.CLUBS).toBe("♣️");
        expect(suitMap.SPADES).toBe("♠️");
    });
});

describe("suitOrder", () => {
    it("orders suits spades first", () => {
        expect(suitOrder.SPADES).toBe(0);
        expect(suitOrder.HEARTS).toBe(1);
        expect(suitOrder.CLUBS).toBe(2);
        expect(suitOrder.DIAMONDS).toBe(3);
    });
});

describe("HUMAN_PLAYER_ID", () => {
    it("is P1", () => {
        expect(HUMAN_PLAYER_ID).toBe("P1");
    });
});
