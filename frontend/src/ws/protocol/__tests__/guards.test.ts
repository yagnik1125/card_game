import {
    isDifficulty,
    isGameCreatePayload,
    isGameIdPayload,
    isGameJoinPayload,
    isGameMode,
    isGamePlayCardPayload,
    isGamePlayerPayload,
    isNonEmptyString,
    isRecord,
    isServerEnvelope,
    isServerEventName,
} from "../guards";

describe("ws protocol guards", () => {
    describe("primitives", () => {
        it("isRecord accepts plain objects and rejects null/arrays/primitives", () => {
            expect(isRecord({})).toBe(true);
            expect(isRecord({ a: 1 })).toBe(true);
            expect(isRecord(null)).toBe(false);
            expect(isRecord([])).toBe(false);
            expect(isRecord("x")).toBe(false);
            expect(isRecord(42)).toBe(false);
            expect(isRecord(undefined)).toBe(false);
        });

        it("isNonEmptyString accepts non-empty strings only", () => {
            expect(isNonEmptyString("g1")).toBe(true);
            expect(isNonEmptyString("")).toBe(false);
            expect(isNonEmptyString(7)).toBe(false);
            expect(isNonEmptyString(null)).toBe(false);
        });

        it("isDifficulty and isGameMode accept only known values", () => {
            expect(isDifficulty("easy")).toBe(true);
            expect(isDifficulty("medium")).toBe(true);
            expect(isDifficulty("hard")).toBe(true);
            expect(isDifficulty("impossible")).toBe(false);
            expect(isGameMode("SOLO")).toBe(true);
            expect(isGameMode("TEAMS_2V2")).toBe(true);
            expect(isGameMode("ROYALE")).toBe(false);
        });
    });

    describe("isGameCreatePayload", () => {
        it("accepts a valid create payload", () => {
            expect(
                isGameCreatePayload({
                    numberOfRounds: 5,
                    difficulty: "medium",
                    mode: "SOLO",
                })
            ).toBe(true);
            expect(
                isGameCreatePayload({
                    numberOfRounds: 1,
                    difficulty: "hard",
                    mode: "TEAMS_2V2",
                })
            ).toBe(true);
        });

        it("rejects invalid create payloads", () => {
            expect(isGameCreatePayload(null)).toBe(false);
            expect(isGameCreatePayload({})).toBe(false);
            expect(
                isGameCreatePayload({ numberOfRounds: 0, difficulty: "easy", mode: "SOLO" })
            ).toBe(false);
            expect(
                isGameCreatePayload({ numberOfRounds: 101, difficulty: "easy", mode: "SOLO" })
            ).toBe(false);
            expect(
                isGameCreatePayload({ numberOfRounds: 2.5, difficulty: "easy", mode: "SOLO" })
            ).toBe(false);
            expect(
                isGameCreatePayload({ numberOfRounds: "5", difficulty: "easy", mode: "SOLO" })
            ).toBe(false);
            expect(
                isGameCreatePayload({ numberOfRounds: 5, difficulty: "brutal", mode: "SOLO" })
            ).toBe(false);
            expect(
                isGameCreatePayload({ numberOfRounds: 5, difficulty: "easy", mode: "2V2" })
            ).toBe(false);
        });
    });

    describe("isGameJoinPayload", () => {
        it("accepts gameId + playerId", () => {
            expect(isGameJoinPayload({ gameId: "g1", playerId: "P1" })).toBe(true);
        });

        it("rejects missing/wrong-typed fields", () => {
            expect(isGameJoinPayload({})).toBe(false);
            expect(isGameJoinPayload({ gameId: "g1" })).toBe(false);
            expect(isGameJoinPayload({ playerId: "P1" })).toBe(false);
            expect(isGameJoinPayload({ gameId: "", playerId: "P1" })).toBe(false);
            expect(isGameJoinPayload({ gameId: "g1", playerId: 7 })).toBe(false);
        });
    });

    describe("isGameIdPayload", () => {
        it("accepts a payload with a non-empty gameId", () => {
            expect(isGameIdPayload({ gameId: "g1" })).toBe(true);
        });

        it("rejects payloads without a valid gameId", () => {
            expect(isGameIdPayload({})).toBe(false);
            expect(isGameIdPayload({ gameId: "" })).toBe(false);
            expect(isGameIdPayload({ gameId: 3 })).toBe(false);
            expect(isGameIdPayload(null)).toBe(false);
        });
    });

    describe("isGamePlayerPayload", () => {
        it("accepts gameId + playerId", () => {
            expect(isGamePlayerPayload({ gameId: "g1", playerId: "P2" })).toBe(true);
        });

        it("rejects missing fields", () => {
            expect(isGamePlayerPayload({ gameId: "g1" })).toBe(false);
            expect(isGamePlayerPayload({ playerId: "P2" })).toBe(false);
            expect(isGamePlayerPayload({ gameId: "g1", playerId: "" })).toBe(false);
        });
    });

    describe("isGamePlayCardPayload", () => {
        it("accepts gameId + playerId + cardId", () => {
            expect(
                isGamePlayCardPayload({ gameId: "g1", playerId: "P1", cardId: "c1" })
            ).toBe(true);
        });

        it("rejects missing cardId or non-string fields", () => {
            expect(isGamePlayCardPayload({ gameId: "g1", playerId: "P1" })).toBe(false);
            expect(
                isGamePlayCardPayload({ gameId: "g1", playerId: "P1", cardId: "" })
            ).toBe(false);
            expect(
                isGamePlayCardPayload({ gameId: "g1", playerId: "P1", cardId: 9 })
            ).toBe(false);
        });
    });

    describe("server envelope guards", () => {
        it("isServerEventName accepts known names and rejects unknown", () => {
            expect(isServerEventName("CARD_PLAYED")).toBe(true);
            expect(isServerEventName("GAME_ERROR")).toBe(true);
            expect(isServerEventName("WHATEVER")).toBe(false);
        });

        it("isServerEnvelope accepts a well-formed envelope", () => {
            expect(
                isServerEnvelope({
                    type: "CARD_PLAYED",
                    payload: { playerId: "P2", cardId: "c1", suit: "SPADES", rank: 7 },
                    timestamp: 1700000000000,
                })
            ).toBe(true);
            expect(
                isServerEnvelope({
                    type: "GAME_STATE",
                    payload: { gameId: "g1" },
                    snapshot: { gameId: "g1" },
                    timestamp: 1,
                })
            ).toBe(true);
        });

        it("isServerEnvelope rejects malformed envelopes", () => {
            expect(isServerEnvelope(null)).toBe(false);
            expect(
                isServerEnvelope({ type: "GAME_STATE", payload: { gameId: "g1" } })
            ).toBe(false);
            expect(
                isServerEnvelope({
                    type: "UNKNOWN",
                    payload: { gameId: "g1" },
                    timestamp: 1,
                })
            ).toBe(false);
            expect(
                isServerEnvelope({
                    type: "GAME_STATE",
                    payload: [],
                    timestamp: 1,
                })
            ).toBe(false);
        });
    });
});
