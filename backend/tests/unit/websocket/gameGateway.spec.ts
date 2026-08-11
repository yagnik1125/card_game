import { beforeEach, describe, expect, it, vi } from "vitest";
import { GameGateway } from "../../../src/websocket/GameGateway.js";

describe("GameGateway", () => {
    beforeEach(() => {
        GameGateway.uninitialize();
    });

    it("getIO throws before the socket server is initialized", () => {
        expect(() => GameGateway.getIO()).toThrow("Socket server not initialized");
    });

    it("hasSocketServer is false before initialize and true after", () => {
        expect(GameGateway.hasSocketServer()).toBe(false);
        GameGateway.initialize({} as any);
        expect(GameGateway.hasSocketServer()).toBe(true);
    });

    it("emitToGame is a safe no-op before initialize", () => {
        expect(() => GameGateway.emitToGame("g1", "CARD_PLAYED", {})).not.toThrow();
    });

    it("joinGame is a safe no-op before initialize", () => {
        expect(() => GameGateway.joinGame("s1", "g1")).not.toThrow();
    });

    it("emitToGame broadcasts to the game room after initialize", () => {
        const emit = vi.fn();
        const to = vi.fn(() => ({ emit }));
        GameGateway.initialize({ to } as any);

        GameGateway.emitToGame("g1", "CARD_PLAYED", { playerId: "P1" });

        expect(to).toHaveBeenCalledWith("g1");
        expect(emit).toHaveBeenCalledWith("CARD_PLAYED", { playerId: "P1" });
    });

    it("joinGame joins the socket to the game room after initialize", () => {
        const join = vi.fn();
        const get = vi.fn(() => ({ join }));
        GameGateway.initialize({ sockets: { sockets: { get } } } as any);

        GameGateway.joinGame("s1", "g1");

        expect(get).toHaveBeenCalledWith("s1");
        expect(join).toHaveBeenCalledWith("g1");
    });

    it("uninitialize restores the no-op behavior", () => {
        const to = vi.fn(() => ({ emit: vi.fn() }));
        GameGateway.initialize({ to } as any);
        GameGateway.uninitialize();

        expect(() => GameGateway.emitToGame("g1", "CARD_PLAYED", {})).not.toThrow();
        expect(GameGateway.hasSocketServer()).toBe(false);
    });
});
