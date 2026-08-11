import { io, Socket } from "socket.io-client";

export function connectClient(
    url: string
): Promise<Socket> {
    return new Promise((resolve, reject) => {
        const socket = io(url, {
            transports: ["websocket"],
            reconnection: false,
            timeout: 10000
        });
        socket.once("connect", () => resolve(socket));
        socket.once("connect_error", (err) => reject(err));
    });
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function emitAck<T = any>(
    socket: Socket,
    event: string,
    payload?: any
): Promise<T> {
    return new Promise((resolve, reject) => {
        const handle = (err: Error | null, ack: T) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(ack);
        };
        if (payload === undefined) {
            socket.timeout(10000).emit(event, handle);
        } else {
            socket.timeout(10000).emit(event, payload, handle);
        }
    });
}

export function nextEvent<T = any>(
    socket: Socket,
    event: string,
    timeoutMs = 2000
): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.off(event, handler);
            reject(new Error(`Timed out waiting for ${event}`));
        }, timeoutMs);
        const handler = (payload: T) => {
            clearTimeout(timer);
            resolve(payload);
        };
        socket.once(event, handler);
    });
}

export function expectNoEvent(
    socket: Socket,
    event: string,
    waitMs = 400
): Promise<void> {
    return new Promise((resolve, reject) => {
        const fail = () => reject(new Error(`Unexpected ${event} received`));
        socket.once(event, fail);
        setTimeout(() => {
            socket.off(event, fail);
            resolve();
        }, waitMs);
    });
}
