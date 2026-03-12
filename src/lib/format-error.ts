import {
    SubnotoError,
    getErrorMessage as sdkGetErrorMessage,
    isTunnelError,
} from "@subnoto/api-client";

const DEFAULT_API_BASE_URL = "https://enclave.subnoto.com";

function hasCode(x: unknown): x is { code?: string } {
    return typeof x === "object" && x !== null && "code" in x;
}

export function formatEnvelopeError(err: unknown, apiBaseUrl: string = DEFAULT_API_BASE_URL): string {
    if (err instanceof SubnotoError) {
        if (/no session id/i.test(err.message)) {
            const hint =
                apiBaseUrl.startsWith("http://") && apiBaseUrl.includes("enclave.subnoto.com")
                    ? " Use HTTPS: set SUBNOTO_BASE_URL=https://enclave.subnoto.com in .env"
                    : "";
            return `Subnoto API handshake failed: ${err.message}.${hint}`;
        }
        const tunnelNote =
            err.code && isTunnelError({ code: err.code })
                ? " Tunnel error (SDK already retried up to 3 times)."
                : "";
        return `${err.message}${tunnelNote}`;
    }
    if (err instanceof Error) {
        const cause = err.cause;
        const code = hasCode(cause) ? cause.code : undefined;
        if (err.message.includes("fetch failed") || code === "ECONNREFUSED") {
            return `Cannot reach Subnoto API at ${apiBaseUrl}. Check that the API or tunnel is running (e.g. start the api-proxy or use the cloud URL such as https://enclave.subnoto.com).`;
        }
        if (cause != null && typeof cause === "object") {
            return sdkGetErrorMessage(cause);
        }
        return err.message;
    }
    return "Unknown error creating envelope";
}

/** Get a user-facing message from an API error payload (e.g. result.error from client.POST). */
export function messageFromApiError(error: unknown): string {
    return sdkGetErrorMessage(error);
}
