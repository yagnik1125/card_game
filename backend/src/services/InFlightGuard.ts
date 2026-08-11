export class InFlightGuard {
    private static inFlight: Set<string> = new Set();

    static tryAcquire(gameId: string): boolean {
        if (this.inFlight.has(gameId)) {
            return false;
        }
        this.inFlight.add(gameId);
        return true;
    }

    static release(gameId: string): void {
        this.inFlight.delete(gameId);
    }

    static isInFlight(gameId: string): boolean {
        return this.inFlight.has(gameId);
    }

    static clear(): void {
        this.inFlight.clear();
    }
}
