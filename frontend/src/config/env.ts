const DEFAULT_API_URL = "http://localhost:5000/api";

const importMetaEnv: Record<string, string | undefined> =
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

const processEnv: Record<string, string | undefined> =
    typeof globalThis !== "undefined"
        ? (globalThis as { process?: { env?: Record<string, string | undefined> } })
              .process?.env ?? {}
        : {};

/**
 * Resolves a VITE_* variable. `process.env` takes priority so the value can be
 * overridden in node contexts (vitest stubs, `tsx` scripts, CI); in the Vite
 * browser build `process` is undefined and `import.meta.env` is the source.
 */
function envValue(key: string): string | undefined {
    return processEnv[key] ?? importMetaEnv[key] ?? undefined;
}

function stripApiSuffix(url: string): string {
    return url.replace(/\/api\/?$/, "");
}

export const API_BASE_URL: string = envValue("VITE_API_URL") || DEFAULT_API_URL;

export const WS_URL: string =
    envValue("VITE_WS_URL") || stripApiSuffix(API_BASE_URL);
