import { beforeEach, describe, expect, it, vi } from "vitest";

describe("config/env", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.unstubAllEnvs();
    });

    it("derives WS_URL by stripping the /api suffix from VITE_API_URL", async () => {
        vi.stubEnv("VITE_API_URL", "http://localhost:5000/api");
        vi.stubEnv("VITE_WS_URL", "");
        const mod = await import("@/config/env");
        expect(mod.API_BASE_URL).toBe("http://localhost:5000/api");
        expect(mod.WS_URL).toBe("http://localhost:5000");
    });

    it("prefers an explicit VITE_WS_URL override", async () => {
        vi.stubEnv("VITE_API_URL", "http://192.168.1.5:5000/api");
        vi.stubEnv("VITE_WS_URL", "ws://192.168.1.5:5000");
        const mod = await import("@/config/env");
        expect(mod.API_BASE_URL).toBe("http://192.168.1.5:5000/api");
        expect(mod.WS_URL).toBe("ws://192.168.1.5:5000");
    });

    it("falls back to the default API URL when unset", async () => {
        vi.stubEnv("VITE_API_URL", "");
        vi.stubEnv("VITE_WS_URL", "");
        const mod = await import("@/config/env");
        expect(mod.API_BASE_URL).toBe("http://localhost:5000/api");
        expect(mod.WS_URL).toBe("http://localhost:5000");
    });

    it("strips a trailing-slash /api suffix", async () => {
        vi.stubEnv("VITE_API_URL", "http://localhost:5000/api/");
        vi.stubEnv("VITE_WS_URL", "");
        const mod = await import("@/config/env");
        expect(mod.WS_URL).toBe("http://localhost:5000");
    });
});
