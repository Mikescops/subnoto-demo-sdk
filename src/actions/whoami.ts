"use server";

import { getClientAndWorkspace } from "../lib/subnoto-client.js";

export type WhoamiResult =
    | {
          apiBaseUrl: string;
          teamUuid: string;
          teamName: string;
          ownerEmail: string;
          ownerUuid: string;
          accessKey: string;
      }
    | { error: string };

export async function getWhoami(): Promise<WhoamiResult> {
    const ctx = getClientAndWorkspace();
    if ("error" in ctx) return { error: ctx.error };
    const { client, baseUrl } = ctx;
    try {
        const { data, error } = await client.POST("/public/utils/whoami", {
            body: {},
        });
        if (error || !data) {
            const msg =
                error && typeof error === "object" && error !== null
                    ? ((error as { error?: { message?: string } }).error?.message ??
                      (error as { message?: string }).message)
                    : error != null
                      ? String(error)
                      : "Failed to get whoami";
            return { error: msg ?? "Failed to get whoami" };
        }
        return {
            apiBaseUrl: baseUrl,
            teamUuid: data.teamUuid,
            teamName: data.teamName,
            ownerEmail: data.ownerEmail,
            ownerUuid: data.ownerUuid,
            accessKey: data.accessKey,
        };
    } catch (err) {
        console.error("[getWhoami] Error:", err);
        return {
            error: err instanceof Error ? err.message : "Failed to get environment info",
        };
    }
}

/** Returns the API key owner email from the whoami endpoint. Use as signer email for demos. */
export async function getOwnerEmail(): Promise<{ email: string } | { error: string }> {
    const whoami = await getWhoami();
    if ("error" in whoami) return { error: whoami.error };
    return { email: whoami.ownerEmail };
}
