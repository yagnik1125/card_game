import { describe, expect, it } from "vitest";
import {
    isGameCreatePayload,
    isGameIdPayload,
    isGameJoinPayload,
    isGamePlayerPayload,
    isGamePlayCardPayload,
    isRecord,
} from "../../../src/websocket/protocol/guards.js";

describe("client command guards", () => {
    describe("isRecord", () => {
        it("accepts plain objects", () => {
            expect(isRecord({})).toBe(true);
            expect(isRecord({ gameId: "g1" })).toBe(true);
        });

        it("rejects null, arrays, and primitives", () => {
            expect(isRecord(null)).toBe(false);
            expect(isRecord([])).toBe(false);
            expect(isRecord("x")).toBe(false);
            expect(isRecord(42)).toBe(false);
            expect(isRecord(undefined)).toBe(false);
        });
    });

    describe("isGameCreatePayload", () => {
        it("accepts valid create payloads", () => {
            expect(
                isGameCreatePayload({ numberOfRounds: 2, difficulty: "easy", mode: "SOLO" })
            ).toBe(true);
            expect(
                isGameCreatePayload({ numberOfRounds: 13, difficulty: "hard", mode: "TEAMS_2V2" })
            ).toBe(true);
        });

        it("rejects an invalid difficulty", () => {
            expect(
                isGameCreatePayload({ numberOfRounds: 2, difficulty: "expert", mode: "SOLO" })
            ).toBe(false);
        });

        it("rejects an invalid mode", () => {
            expect(
                isGameCreatePayload({ numberOfRounds: 2, difficulty: "easy", mode: "1V1" })
            ).toBe(false);
        });

        it("rejects non-integer or out-of-range round counts", () => {
            expect(
                isGameCreatePayload({ numberOfRounds: 0, difficulty: "easy", mode: "SOLO" })
            ).toBe(false);
            expect(
                isGameCreatePayload({ numberOfRounds: 101, difficulty: "easy", mode: "SOLO" })
            ).toBe(false);
            expect(
                isGameCreatePayload({ numberOfRounds: 1.5, difficulty: "easy", mode: "SOLO" })
            ).toBe(false);
            expect(
                isGameCreatePayload({ numberOfRounds: "2", difficulty: "easy", mode: "SOLO" })
            ).toBe(false);
        });

        it("rejects non-objects", () => {
            expect(isGameCreatePayload(null)).toBe(false);
            expect(isGameCreatePayload("SOLO")).toBe(false);
        });
    });

    describe("isGameJoinPayload", () => {
        it("accepts a valid join payload", () => {
            expect(isGameJoinPayload({ gameId: "g1", playerId: "P1" })).toBe(true);
        });

        it("rejects missing or empty fields", () => {
            expect(isGameJoinPayload({ gameId: "g1" })).toBe(false);
            expect(isGameJoinPayload({ gameId: "", playerId: "P1" })).toBe(false);
            expect(isGameJoinPayload({ gameId: "g1", playerId: "" })).toBe(false);
            expect(isGameJoinPayload({ gameId: 5, playerId: "P1" })).toBe(false);
        });
    });

    describe("isGamePlayCardPayload", () => {
        it("accepts a valid play-card payload", () => {
            expect(
                isGamePlayCardPayload({ gameId: "g1", playerId: "P1", cardId: "12" })
            ).toBe(true);
        });

        it("rejects missing cardId or playerId", () => {
            expect(isGamePlayCardPayload({ gameId: "g1", playerId: "P1" })).toBe(false);
            expect(isGamePlayCardPayload({ gameId: "g1", cardId: "12" })).toBe(false);
        });
    });

    describe("isGameIdPayload", () => {
        it("accepts a payload that only needs a gameId", () => {
            expect(isGameIdPayload({ gameId: "g1" })).toBe(true);
        });

        it("rejects payloads without a gameId", () => {
            expect(isGameIdPayload({})).toBe(false);
            expect(isGameIdPayload({ gameId: "" })).toBe(false);
            expect(isGameIdPayload(null)).toBe(false);
        });
    });

    describe("isGamePlayerPayload", () => {
        it("accepts a payload with gameId and playerId", () => {
            expect(isGamePlayerPayload({ gameId: "g1", playerId: "P2" })).toBe(true);
        });

        it("rejects payloads missing the playerId", () => {
            expect(isGamePlayerPayload({ gameId: "g1" })).toBe(false);
        });
    });
});
