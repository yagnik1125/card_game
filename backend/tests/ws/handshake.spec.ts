import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectClient, emitAck } from "../helpers/wsClient.js";
import { startTestServer, TestServer } from "../helpers/server.js";

let server: TestServer;

beforeAll(async () => {
    server = await startTestServer();
});

afterAll(async () => {
    await server.close();
});

describe("WebSocket handshake", () => {
    it("a client can connect and receive a GAME:PING ack", async () => {
        const socket = await connectClient(server.url);
        const ack = await emitAck(socket, "GAME:PING");
        expect(ack).toEqual({ ok: true, data: null });
        socket.close();
    });

    it("multiple clients can connect simultaneously", async () => {
        const first = await connectClient(server.url);
        const second = await connectClient(server.url);
        expect(first.connected).toBe(true);
        expect(second.connected).toBe(true);
        first.close();
        second.close();
    });

    it("a disconnect is clean and the server keeps accepting connections", async () => {
        const first = await connectClient(server.url);
        const disconnected = new Promise<void>((resolve) =>
            first.once("disconnect", () => resolve())
        );
        first.close();
        await disconnected;

        const second = await connectClient(server.url);
        expect(second.connected).toBe(true);
        second.close();
    });
});
