import { vi, type Mock } from "vitest";

export interface FakeSocket {
    connected: boolean;
    active: boolean;
    on: Mock<(event: string, cb: (...args: unknown[]) => void) => void>;
    off: Mock<(event: string, cb: (...args: unknown[]) => void) => void>;
    emit: Mock<(...args: unknown[]) => void>;
    timeout: Mock<(ms: number) => FakeSocket>;
    connect: Mock<() => void>;
    disconnect: Mock<() => void>;
    removeAllListeners: Mock<() => void>;
}

export interface FakeSocketHandle {
    socket: FakeSocket;
    handlers: Record<string, Array<(...args: unknown[]) => void>>;
    fire: (event: string, ...args: unknown[]) => void;
}

export function makeFakeSocket(): FakeSocketHandle {
    const handlers: Record<string, Array<(...args: unknown[]) => void>> = {};
    const socket: FakeSocket = {
        connected: false,
        active: false,
        on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
            (handlers[event] ??= []).push(cb);
        }),
        off: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
            handlers[event] = (handlers[event] ?? []).filter((h) => h !== cb);
        }),
        emit: vi.fn(),
        timeout: vi.fn(() => socket),
        connect: vi.fn(() => {
            // A real socket connects asynchronously: `connected` only becomes
            // true when the server actually responds (the "connect" event), so
            // the fake leaves it false here and `fire("connect")` drives it.
            socket.active = false;
        }),
        disconnect: vi.fn(() => {
            socket.connected = false;
        }),
        removeAllListeners: vi.fn(),
    };
    return {
        socket,
        handlers,
        fire: (event: string, ...args: unknown[]) => {
            (handlers[event] ?? []).forEach((h) => h(...args));
        },
    };
}
