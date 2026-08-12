import { describe, expect, it } from "vitest";
import {
    friendlyErrorMessage,
    mapGameError,
    WS_ERROR_MESSAGES,
} from "../errors";

describe("WS_ERROR_MESSAGES", () => {
    it("maps the known backend error codes to friendly copy", () => {
        expect(WS_ERROR_MESSAGES.ILLEGAL_MOVE).toBe("Not a legal move");
        expect(WS_ERROR_MESSAGES.NOT_YOUR_TURN).toBe("Not your turn");
        expect(WS_ERROR_MESSAGES.GAME_BUSY).toBe("Bots are playing, one moment");
        expect(WS_ERROR_MESSAGES.GAME_NOT_FOUND).toBe("Game not found");
    });

    it("friendlyErrorMessage falls back to the server message for unknown codes", () => {
        expect(friendlyErrorMessage("WEIRD_CODE", "server says")).toBe(
            "server says"
        );
        expect(friendlyErrorMessage(undefined, "server says")).toBe("server says");
    });

    it("mapGameError preserves the code and maps a known code", () => {
        expect(
            mapGameError({ code: "ILLEGAL_MOVE", message: "raw message" })
        ).toEqual({ code: "ILLEGAL_MOVE", message: "Not a legal move" });
        expect(
            mapGameError({ code: "CUSTOM", message: "custom text" })
        ).toEqual({ code: "CUSTOM", message: "custom text" });
    });
});
