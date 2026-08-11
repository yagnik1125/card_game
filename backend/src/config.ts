/**
 * Server configuration loaded from environment variables.
 *
 * `CORS_ORIGINS` is a comma-separated allow-list of origins that may call the
 * REST API and connect over Socket.IO (used by both `app.ts` and
 * `createGameServer.ts`). Set it to `*` to allow any origin (dev convenience;
 * not recommended for public deployments). Defaults to the Vite dev server.
 */

function envList(name: string, fallback: string[]): string[] {
    const raw = process.env[name];
    if (!raw) {
        return fallback;
    }
    return raw
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
}

export const ALLOWED_CORS_ORIGINS: string | string[] =
    process.env.CORS_ORIGINS === "*"
        ? "*"
        : envList("CORS_ORIGINS", ["http://localhost:5173"]);
