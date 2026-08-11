import { selectSoloMatchWinner } from "@/utils/winner";

const players = [
    { id: "P1", name: "You", totalTricks: 10, roundsWon: 1 },
    { id: "P2", name: "Bot 2", totalTricks: 8, roundsWon: 2 },
    { id: "P3", name: "Bot 3", totalTricks: 12, roundsWon: 1 },
];

describe("selectSoloMatchWinner", () => {
    it("returns undefined for an empty list", () => {
        expect(selectSoloMatchWinner([])).toBeUndefined();
    });

    it("prefers the player with the most rounds won", () => {
        const winner = selectSoloMatchWinner(players as any);
        expect(winner?.id).toBe("P2");
    });

    it("breaks ties on rounds won by total tricks", () => {
        const tied = [
            { id: "P1", name: "You", totalTricks: 5, roundsWon: 1 },
            { id: "P2", name: "Bot 2", totalTricks: 8, roundsWon: 1 },
        ];
        const winner = selectSoloMatchWinner(tied as any);
        expect(winner?.id).toBe("P2");
    });

    it("falls back to total tricks when rounds won is missing", () => {
        const noRounds = [
            { id: "P1", name: "You", totalTricks: 5 },
            { id: "P2", name: "Bot 2", totalTricks: 8 },
        ];
        const winner = selectSoloMatchWinner(noRounds as any);
        expect(winner?.id).toBe("P2");
    });

    it("does not mutate the input array", () => {
        const copy = [...players];
        selectSoloMatchWinner(copy as any);
        expect(copy[0].id).toBe("P1");
        expect(copy[1].id).toBe("P2");
    });
});
