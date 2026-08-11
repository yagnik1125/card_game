import { beforeEach, describe, expect, it } from "vitest";
import { ConnectionStore } from "../../../src/websocket/ConnectionStore.js";

describe("ConnectionStore", () => {
    beforeEach(() => {
        ConnectionStore.clear();
    });

    it("stores and retrieves a socket connection", () => {
        ConnectionStore.add({ socketId: "s1", gameId: "g1", playerId: "P1" });
        expect(ConnectionStore.get("s1")).toEqual({ socketId: "s1", gameId: "g1", playerId: "P1" });
    });

    it("returns undefined for an unknown socket", () => {
        expect(ConnectionStore.get("nope")).toBeUndefined();
    });

    it("overwrites an existing entry for the same socket (rejoin)", () => {
        ConnectionStore.add({ socketId: "s1", gameId: "g1", playerId: "P1" });
        ConnectionStore.add({ socketId: "s1", gameId: "g2", playerId: "P2" });
        expect(ConnectionStore.get("s1")).toEqual({ socketId: "s1", gameId: "g2", playerId: "P2" });
    });

    it("remove deletes the entry and returns it", () => {
        ConnectionStore.add({ socketId: "s1", gameId: "g1", playerId: "P1" });
        const removed = ConnectionStore.remove("s1");
        expect(removed).toEqual({ socketId: "s1", gameId: "g1", playerId: "P1" });
        expect(ConnectionStore.get("s1")).toBeUndefined();
    });

    it("remove returns undefined for an unknown socket", () => {
        expect(ConnectionStore.remove("nope")).toBeUndefined();
    });

    it("tracks multiple connections and supports querying all", () => {
        ConnectionStore.add({ socketId: "s1", gameId: "g1", playerId: "P1" });
        ConnectionStore.add({ socketId: "s2", gameId: "g1", playerId: "P2" });
        ConnectionStore.add({ socketId: "s3", gameId: "g2", playerId: "P3" });

        const all = ConnectionStore.getAll();
        expect(all).toHaveLength(3);
        expect(all.map((c) => c.socketId)).toEqual(["s1", "s2", "s3"]);
    });

    it("clear empties the store", () => {
        ConnectionStore.add({ socketId: "s1", gameId: "g1", playerId: "P1" });
        ConnectionStore.clear();
        expect(ConnectionStore.getAll()).toHaveLength(0);
    });
});
