import { CLIENT_COMMAND_NAMES, type ClientCommandName } from "../clientCommands";
import { SERVER_EVENT_NAMES, type ServerEventName } from "../serverEvents";
import { errorAck, okAck } from "../responses";

describe("ws protocol contracts", () => {
    it("CLIENT_COMMAND_NAMES lists every command exactly once", () => {
        expect([...CLIENT_COMMAND_NAMES]).toEqual([
            "GAME:PING",
            "GAME:CREATE",
            "GAME:JOIN",
            "GAME:LEAVE",
            "GAME:REMOVE",
            "GAME:PLAY_CARD",
            "GAME:GET_STATE",
            "GAME:GET_TURN",
            "GAME:GET_LEGAL_MOVES",
            "GAME:GET_HAND",
        ]);
        expect(new Set(CLIENT_COMMAND_NAMES).size).toBe(CLIENT_COMMAND_NAMES.length);
    });

    it("SERVER_EVENT_NAMES lists every event exactly once", () => {
        expect([...SERVER_EVENT_NAMES]).toEqual([
            "GAME_CREATED",
            "GAME_JOINED",
            "GAME_LEFT",
            "ROUND_STARTED",
            "CARD_PLAYED",
            "BOT_PLAY",
            "TURN_CHANGED",
            "TRUMP_DECLARED",
            "TRICK_COMPLETED",
            "ROUND_COMPLETED",
            "MATCH_COMPLETED",
            "GAME_STATE",
            "GAME_REMOVED",
            "GAME_ERROR",
        ]);
        expect(new Set(SERVER_EVENT_NAMES).size).toBe(SERVER_EVENT_NAMES.length);
    });

    it("every command name is assignable to ClientCommandName", () => {
        const names: ClientCommandName[] = [...CLIENT_COMMAND_NAMES];
        expect(names).toHaveLength(10);
    });

    it("every event name is assignable to ServerEventName", () => {
        const names: ServerEventName[] = [...SERVER_EVENT_NAMES];
        expect(names).toHaveLength(14);
    });

    it("okAck builds a successful ack", () => {
        const ack = okAck({ gameId: "g1" });
        expect(ack).toEqual({ ok: true, data: { gameId: "g1" } });
        expect(ack.error).toBeUndefined();
    });

    it("errorAck builds a failed ack with a typed error", () => {
        const ack = errorAck("BAD_PAYLOAD", "Invalid payload", "g1");
        expect(ack).toEqual({
            ok: false,
            error: { code: "BAD_PAYLOAD", message: "Invalid payload", gameId: "g1" },
        });
        expect(ack.data).toBeUndefined();
    });

    it("WsAck union matches ok/error shapes", () => {
        const ok = okAck({ gameId: "g1" });
        const err = errorAck("GAME_NOT_FOUND", "Game not found");
        expect(ok.ok).toBe(true);
        if (ok.ok && ok.data) {
            expect(ok.data.gameId).toBe("g1");
        }
        expect(err.ok).toBe(false);
        if (!err.ok && err.error) {
            expect(err.error.code).toBe("GAME_NOT_FOUND");
        }
    });
});
