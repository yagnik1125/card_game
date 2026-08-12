import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeSocket } from "../../client/__tests__/fakeSocket";

const { ioMock } = vi.hoisted(() => ({ ioMock: vi.fn() }));

vi.mock("socket.io-client", () => ({
    io: (...args: unknown[]) => ioMock(...args),
}));

import { useSocket } from "../useSocket";
import { resetConnection } from "../../client/connection";
import { resetSocketClient } from "../../client/socketClient";

function Probe({ url }: { url?: string }) {
    const { status, error, reconnecting } = useSocket(url);
    return (
        <div>
            <span data-testid="status">{status}</span>
            <span data-testid="error">{error?.message ?? "none"}</span>
            <span data-testid="reconnecting">
                {reconnecting ? "true" : "false"}
            </span>
        </div>
    );
}

describe("useSocket", () => {
    beforeEach(() => {
        resetSocketClient();
        resetConnection();
        ioMock.mockReset();
    });

    it("connects on mount and reflects the live status", () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);

        const { getByTestId } = render(<Probe />);
        expect(socket.connect).toHaveBeenCalledTimes(1);
        expect(getByTestId("status").textContent).toBe("connecting");
        expect(getByTestId("reconnecting").textContent).toBe("false");

        act(() => {
            fire("connect");
        });
        expect(getByTestId("status").textContent).toBe("connected");

        act(() => {
            fire("disconnect", "transport close");
        });
        expect(getByTestId("status").textContent).toBe("reconnecting");
        expect(getByTestId("reconnecting").textContent).toBe("true");
    });

    it("surfaces connect errors and clears them on reconnect", () => {
        const { socket, fire } = makeFakeSocket();
        ioMock.mockReturnValue(socket);

        const { getByTestId } = render(<Probe />);

        act(() => {
            fire("connect_error", new Error("boom"));
        });
        expect(getByTestId("status").textContent).toBe("error");
        expect(getByTestId("error").textContent).toBe("boom");

        act(() => {
            fire("connect");
        });
        expect(getByTestId("status").textContent).toBe("connected");
        expect(getByTestId("error").textContent).toBe("none");
    });

    it("passes the url override to the io() factory", () => {
        const { socket } = makeFakeSocket();
        ioMock.mockReturnValue(socket);

        render(<Probe url="ws://192.168.1.5:5000" />);
        expect(ioMock).toHaveBeenCalledWith(
            "ws://192.168.1.5:5000",
            expect.objectContaining({ autoConnect: false })
        );
    });

    it("disconnects on unmount", () => {
        const { socket } = makeFakeSocket();
        ioMock.mockReturnValue(socket);

        const { unmount } = render(<Probe />);
        unmount();
        expect(socket.disconnect).toHaveBeenCalledTimes(1);
    });
});
