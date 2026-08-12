export function extractErrorMessage(
    error: unknown,
    fallback: string
): string {
    if (error && typeof error === "object") {
        const anyError = error as {
            response?: { data?: { message?: unknown } };
            message?: unknown;
        };
        const serverMessage = anyError.response?.data?.message;
        if (typeof serverMessage === "string" && serverMessage.length > 0) {
            return serverMessage;
        }
        if (typeof anyError.message === "string" && anyError.message.length > 0) {
            return anyError.message;
        }
    }
    return fallback;
}
