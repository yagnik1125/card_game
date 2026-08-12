import { beforeEach, describe, expect, it } from "vitest";
import { InFlightGuard } from "../../../src/services/InFlightGuard.js";

describe("InFlightGuard", () => {
    beforeEach(() => {
        InFlightGuard.clear();
    });

    it("acquires a game that is not in flight", () => {
        expect(InFlightGuard.tryAcquire("g1")).toBe(true);
        expect(InFlightGuard.isInFlight("g1")).toBe(true);
    });

    it("rejects a second acquire for the same game", () => {
        expect(InFlightGuard.tryAcquire("g1")).toBe(true);
        expect(InFlightGuard.tryAcquire("g1")).toBe(false);
    });

    it("allows different games to be in flight concurrently", () => {
        expect(InFlightGuard.tryAcquire("g1")).toBe(true);
        expect(InFlightGuard.tryAcquire("g2")).toBe(true);
        expect(InFlightGuard.isInFlight("g1")).toBe(true);
        expect(InFlightGuard.isInFlight("g2")).toBe(true);
    });

    it("release frees the game for a later re-acquire", () => {
        InFlightGuard.tryAcquire("g1");
        InFlightGuard.release("g1");
        expect(InFlightGuard.isInFlight("g1")).toBe(false);
        expect(InFlightGuard.tryAcquire("g1")).toBe(true);
    });

    it("release on a non-in-flight game is a safe no-op", () => {
        expect(() => InFlightGuard.release("g1")).not.toThrow();
        expect(InFlightGuard.isInFlight("g1")).toBe(false);
    });

    it("clear empties all in-flight games", () => {
        InFlightGuard.tryAcquire("g1");
        InFlightGuard.tryAcquire("g2");
        InFlightGuard.clear();
        expect(InFlightGuard.isInFlight("g1")).toBe(false);
        expect(InFlightGuard.isInFlight("g2")).toBe(false);
        expect(InFlightGuard.tryAcquire("g1")).toBe(true);
    });
});
