"use server";

import { getErrorMessage } from "@subnoto/api-client";
import { getClientAndWorkspace } from "../lib/subnoto-client.js";

const DEFAULT_API_BASE_URL = "https://enclave.subnoto.com";

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
    const { client } = ctx;
    const apiBaseUrl = process.env.SUBNOTO_BASE_URL ?? DEFAULT_API_BASE_URL;
    try {
        const { data, error } = await client.POST("/public/utils/whoami", {
            body: {},
        });
        if (error || !data) {
            const msg = error != null ? getErrorMessage(error) : "Failed to get whoami";
            return { error: msg ?? "Failed to get whoami" };
        }
        return {
            apiBaseUrl,
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
