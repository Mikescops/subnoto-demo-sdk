import { SubnotoError } from "@subnoto/api-client";

export function formatEnvelopeError(err: unknown, apiBaseUrl: string): string {
    if (err instanceof SubnotoError) {
        if (/no session id/i.test(err.message)) {
            const hint =
                apiBaseUrl.startsWith("http://") && apiBaseUrl.includes("enclave.subnoto.com")
                    ? " Use HTTPS: set SUBNOTO_BASE_URL=https://enclave.subnoto.com in .env"
                    : "";
            return `Subnoto API handshake failed: ${err.message}.${hint}`;
        }
        return err.message;
    }
    if (err instanceof Error) {
        const cause = (err as Error & { cause?: unknown }).cause;
        const code = cause && typeof cause === "object" && "code" in cause ? (cause as { code?: string }).code : null;
        if (err.message.includes("fetch failed") || code === "ECONNREFUSED") {
            return `Cannot reach Subnoto API at ${apiBaseUrl}. Check that the API or tunnel is running (e.g. start the api-proxy or use the cloud URL such as https://enclave.subnoto.com).`;
        }
        return err.message;
    }
    return "Unknown error creating envelope";
}
