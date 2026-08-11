import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeSocket } from "./fakeSocket";

const { ioMock } = vi.hoisted(() => ({ ioMock: vi.fn() }));

vi.mock("socket.io-client", () => ({
    io: (...args: unknown[]) => ioMock(...args),
}));

import {
    connect,
    disconnect,
    emitWithAck,
    getSocket,
    offServerEvent,
    onServerEvent,
    resetSocketClient,
} from "../socketClient";
import {
    getConnectionStatus,
    onConnectionChange,
    resetConnection,
    type ConnectionStatus,
} from "../connection";

type AckCallback = (err: Error | null, ack?: unknown) => void;

describe("socketClient", () => {
    beforeEach(() => {
        resetSocketClient();
        resetConnection();
        ioMock.mockReset();
    });

    it("creates a singleton socket lazily", () => {
        const { socket } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        expect(ioMock).not.toHaveBeenCalled();
        const first = getSocket();
        const second = getSocket();
        expect(first).toBe(second);
        expect(ioMock).toHaveBeenCalledTimes(1);
        expect(ioMock).toHaveBeenCalledWith(expect.any(String), {
            autoConnect: false,
        });
    });

    it("connect() sets connecting and the connect event sets connected", () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        const statuses: ConnectionStatus[] = [];
        onConnectionChange((status) => statuses.push(status));

        connect();
        expect(socket.connect).toHaveBeenCalledTimes(1);
        expect(statuses).toContain("connecting");

        fire("connect");
        expect(getConnectionStatus()).toBe("connected");
    });

    it("disconnect() disconnects the socket and returns to idle", () => {
        const { socket } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        connect();
        disconnect();
        expect(socket.disconnect).toHaveBeenCalledTimes(1);
        expect(getConnectionStatus()).toBe("idle");
    });

    it("keeps the socket connected until the last subscriber disconnects", () => {
        const { socket } = makeFakeSocket();
        ioMock.mockReturnValue(socket);

        connect();
        connect();
        expect(socket.connect).toHaveBeenCalledTimes(2);

        disconnect();
        expect(socket.disconnect).not.toHaveBeenCalled();
        expect(getConnectionStatus()).toBe("connecting");

        disconnect();
        expect(socket.disconnect).toHaveBeenCalledTimes(1);
        expect(getConnectionStatus()).toBe("idle");
    });

    it("connect() on an already-connected socket keeps the connected status", () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        const statuses: ConnectionStatus[] = [];
        onConnectionChange((status) => statuses.push(status));

        connect();
        fire("connect");
        expect(getConnectionStatus()).toBe("connected");

        // A second subscriber joins the established socket: the "connect"
        // event will not re-fire, so the status must not be reset to
        // "connecting" (that would leave the store stuck while connected).
        socket.connected = true;
        connect();
        expect(socket.connect).toHaveBeenCalledTimes(2);
        expect(statuses.filter((s) => s === "connecting")).toHaveLength(1);
        expect(getConnectionStatus()).toBe("connected");
    });

    it("a transport close while connected moves to reconnecting", () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        connect();
        fire("disconnect", "transport close");
        expect(getConnectionStatus()).toBe("reconnecting");
    });

    it("emitWithAck resolves the ack data on success", async () => {
        const { socket } = makeFakeSocket();
        ioMock.mockReturnValue(socket);

        const promise = emitWithAck("GAME:PING");
        expect(socket.timeout).toHaveBeenCalledWith(5000);
        const [event, handle] = socket.emit.mock.calls[0] as unknown as [
            string,
            AckCallback
        ];
        expect(event).toBe("GAME:PING");

        handle(null, { ok: true, data: null });
        await expect(promise).resolves.toEqual({ ok: true, data: null });
    });

    it("emitWithAck passes the payload and a custom timeout", async () => {
        const { socket } = makeFakeSocket();
        ioMock.mockReturnValue(socket);

        const promise = emitWithAck(
            "GAME:CREATE",
            { numberOfRounds: 5, difficulty: "easy", mode: "SOLO" },
            3000
        );
        expect(socket.timeout).toHaveBeenCalledWith(3000);
        const [event, payload, handle] = socket.emit.mock.calls[0] as unknown as [
            string,
            unknown,
            AckCallback
        ];
        expect(event).toBe("GAME:CREATE");
        expect(payload).toEqual({
            numberOfRounds: 5,
            difficulty: "easy",
            mode: "SOLO",
        });

        handle(null, { ok: true, data: { gameId: "g1" } });
        await expect(promise).resolves.toEqual({
            ok: true,
            data: { gameId: "g1" },
        });
    });

    it("emitWithAck resolves a TIMEOUT error ack when the server never acks", async () => {
        const { socket } = makeFakeSocket();
        ioMock.mockReturnValue(socket);

        const promise = emitWithAck("GAME:PING");
        const [event, handle] = socket.emit.mock.calls[0] as unknown as [
            string,
            AckCallback
        ];
        expect(event).toBe("GAME:PING");

        handle(new Error("timeout"), undefined);
        await expect(promise).resolves.toEqual({
            ok: false,
            error: { code: "TIMEOUT", message: "timeout" },
        });
    });

    it("emitWithAck resolves NO_ACK when the server acks with nothing", async () => {
        const { socket } = makeFakeSocket();
        ioMock.mockReturnValue(socket);

        const promise = emitWithAck("GAME:JOIN", { gameId: "g1" });
        const [, , handle] = socket.emit.mock.calls[0] as unknown as [
            string,
            unknown,
            AckCallback
        ];

        handle(null, undefined);
        await expect(promise).resolves.toEqual({
            ok: false,
            error: { code: "NO_ACK", message: expect.stringContaining("GAME:JOIN") },
        });
    });

    it("emitWithAck without a payload passes only the ack callback", async () => {
        const { socket } = makeFakeSocket();
        ioMock.mockReturnValue(socket);

        emitWithAck("GAME:PING");
        expect(socket.emit.mock.calls[0]).toHaveLength(2);
    });

    it("onServerEvent forwards valid envelopes and ignores non-envelopes", () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        const handler = vi.fn();

        onServerEvent("CARD_PLAYED", handler);
        expect(socket.on).toHaveBeenCalledWith(
            "CARD_PLAYED",
            expect.any(Function)
        );

        fire("CARD_PLAYED", {
            type: "CARD_PLAYED",
            payload: {
                playerId: "P2",
                cardId: "c1",
                suit: "SPADES",
                rank: 7,
            },
            timestamp: 1700000000000,
        });
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(
            { playerId: "P2", cardId: "c1", suit: "SPADES", rank: 7 },
            expect.objectContaining({ type: "CARD_PLAYED" })
        );

        fire("CARD_PLAYED", "not-an-envelope");
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it("onServerEvent unsubscribe stops delivery", () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        const handler = vi.fn();

        const off = onServerEvent("GAME_STATE", handler);
        off();
        fire("GAME_STATE", {
            type: "GAME_STATE",
            payload: { gameId: "g1" },
            timestamp: 1,
        });
        expect(handler).not.toHaveBeenCalled();
    });

    it("offServerEvent removes the wrapped listener", () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        const handler = vi.fn();

        onServerEvent("TURN_CHANGED", handler);
        offServerEvent("TURN_CHANGED", handler);
        fire("TURN_CHANGED", {
            type: "TURN_CHANGED",
            payload: { currentPlayerId: "P1", turnNumber: 1 },
            timestamp: 1,
        });
        expect(handler).not.toHaveBeenCalled();
    });

    it("offServerEvent removes only the requested event's listener", () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        const handler = vi.fn();

        onServerEvent("TURN_CHANGED", handler);
        onServerEvent("GAME_STATE", handler);
        offServerEvent("TURN_CHANGED", handler);

        fire("TURN_CHANGED", {
            type: "TURN_CHANGED",
            payload: { currentPlayerId: "P1", turnNumber: 1 },
            timestamp: 1,
        });
        expect(handler).not.toHaveBeenCalled();

        fire("GAME_STATE", {
            type: "GAME_STATE",
            payload: { gameId: "g1" },
            timestamp: 1,
        });
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it("reconnection events drive the status store", () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        connect();

        fire("reconnect_attempt");
        expect(getConnectionStatus()).toBe("reconnecting");

        fire("reconnect_failed");
        expect(getConnectionStatus()).toBe("error");
    });

    it("connect_error maps to error (or reconnecting while active)", () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);
        connect();

        fire("connect_error", new Error("boom"));
        expect(getConnectionStatus()).toBe("error");

        socket.active = true;
        fire("connect_error", new Error("still trying"));
        expect(getConnectionStatus()).toBe("reconnecting");
    });

    it("resetSocketClient clears the singleton", () => {
        const first = makeFakeSocket();
        const second = makeFakeSocket();
        ioMock
            .mockReturnValueOnce(first.socket)
            .mockReturnValueOnce(second.socket);

        const s1 = getSocket();
        resetSocketClient();
        const s2 = getSocket();
        expect(s1).not.toBe(s2);
        expect(first.socket.removeAllListeners).toHaveBeenCalled();
        expect(ioMock).toHaveBeenCalledTimes(2);
    });
});
