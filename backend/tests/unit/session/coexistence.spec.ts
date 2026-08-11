import { afterEach, describe, expect, it, vi } from "vitest";
import { Request, Response } from "express";
import { Server, Socket } from "socket.io";
import { GameMode } from "../../../game-engine/src/core/enums.js";
import { SessionStore } from "../../../game-engine/src/session/SessionStore.js";
import { GameSessionManager } from "../../../game-engine/src/session/GameSessionManager.js";
import { GameService } from "../../../src/services/GameService.js";
import { InFlightGuard } from "../../../src/services/InFlightGuard.js";
import { GameController } from "../../../src/controllers/GameController.js";
import { ConnectionStore } from "../../../src/websocket/ConnectionStore.js";
import {
    handleCreateGame,
    handleGetState,
    handlePlayCard,
    SocketHandlerContext,
} from "../../../src/websocket/handlers/gameHandlers.js";

function makeMocks() {
    const roomEmit = vi.fn();
    const io = { to: vi.fn(() => ({ emit: roomEmit })) };
    const socket = {
        id: "s1",
        join: vi.fn(),
        leave: vi.fn(),
        emit: vi.fn(),
    };
    const ctx: SocketHandlerContext = {
        io: io as unknown as Server,
        socket: socket as unknown as Socket,
    };
    const ack = vi.fn();
    return { io, socket, roomEmit, ctx, ack };
}

function lastAck(ack: ReturnType<typeof vi.fn>): any {
    return ack.mock.calls[ack.mock.calls.length - 1][0];
}

function makeRes(): Response {
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    return res as unknown as Response;
}

function lastJson(res: Response): any {
    const json = (res.json as ReturnType<typeof vi.fn>);
    return json.mock.calls[json.mock.calls.length - 1][0];
}

function lastStatus(res: Response): number {
    const status = (res.status as ReturnType<typeof vi.fn>);
    return status.mock.calls[status.mock.calls.length - 1][0];
}

afterEach(() => {
    SessionStore.getAll().forEach((session) => SessionStore.remove(session.gameId));
    ConnectionStore.clear();
    InFlightGuard.clear();
});

describe("REST + WS coexistence on the same server", () => {
    it("a game created through the REST service entry is playable via the WS handlers, and vice versa", () => {
        const { ctx, ack } = makeMocks();

        const restGame = GameService.createGame(1, "easy", GameMode.SOLO);
        const restGameId = restGame.gameId;

        handleGetState(
            { io: ctx.io, socket: ctx.socket },
            { gameId: restGameId },
            ack
        );
        const stateAck: any = lastAck(ack);
        expect(stateAck.ok).toBe(true);
        expect(stateAck.data.gameId).toBe(restGameId);

        const legal = GameService.getLegalMoves(restGameId, "P1");
        expect(legal.length).toBeGreaterThan(0);

        handlePlayCard(
            { io: ctx.io, socket: ctx.socket },
            { gameId: restGameId, playerId: "P1", cardId: legal[0].id },
            ack
        );
        const playAck: any = lastAck(ack);
        expect(playAck.ok).toBe(true);
        expect(playAck.data.events.some((e: any) => e.type === "CARD_PLAYED")).toBe(true);

        const wsGameId = createWsGame(ctx, ack);
        expect(GameSessionManager.get(wsGameId)).toBeDefined();
        const wsView = GameService.getView(wsGameId);
        expect(wsView.gameId).toBe(wsGameId);
        expect(GameService.getLegalMoves(wsGameId, "P1").length).toBe(13);
    });

    it("the in-flight guard serializes REST play-turn against an in-flight WS play", () => {
        const { ctx, ack } = makeMocks();
        const gameId = createWsGame(ctx, ack);
        const legal = GameService.getLegalMoves(gameId, "P1");

        expect(InFlightGuard.tryAcquire(gameId)).toBe(true);
        try {
            const restRes = makeRes();
            GameController.playTurn(
                { body: { gameId, playerId: "P1", cardId: legal[0].id } } as Request,
                restRes
            );
            expect(lastStatus(restRes)).toBe(409);
            expect(lastJson(restRes)).toEqual({
                success: false,
                message: "Game is busy",
            });

            handlePlayCard(
                ctx,
                { gameId, playerId: "P1", cardId: legal[0].id },
                ack
            );
            const wsBusy: any = lastAck(ack);
            expect(wsBusy.ok).toBe(false);
            expect(wsBusy.error.code).toBe("GAME_BUSY");
        } finally {
            InFlightGuard.release(gameId);
        }

        const restRes = makeRes();
        GameController.playTurn(
            { body: { gameId, playerId: "P1", cardId: legal[0].id } } as Request,
            restRes
        );
        expect(lastStatus(restRes)).toBe(200);
        const body = lastJson(restRes);
        expect(body.success).toBe(true);
        expect(body.data.events.length).toBeGreaterThan(0);
        expect(body.data.snapshot).toBeDefined();
        expect(body.data.snapshot.gameId).toBe(gameId);
    });
});

function createWsGame(
    ctx: SocketHandlerContext,
    ack: ReturnType<typeof vi.fn>
): string {
    handleCreateGame(
        ctx,
        { numberOfRounds: 1, difficulty: "easy", mode: "SOLO" },
        ack
    );
    const res = lastAck(ack);
    expect(res.ok).toBe(true);
    return res.data.gameId;
}
