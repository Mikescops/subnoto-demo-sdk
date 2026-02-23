"use server";

import { getClientAndWorkspace } from "../lib/subnoto-client.js";

export type EnvelopeStatus = "uploading" | "draft" | "approving" | "signing" | "complete" | "declined" | "canceled";

export type GetEnvelopeStatusResult = { status: EnvelopeStatus } | { error: string };

export async function getEnvelopeStatus(envelopeUuid: string): Promise<GetEnvelopeStatusResult> {
    const ctx = getClientAndWorkspace();
    if ("error" in ctx) return { error: ctx.error };
    const { client, workspaceUuid } = ctx;
    try {
        const { data, error } = await client.POST("/public/envelope/get", {
            body: { workspaceUuid, envelopeUuid },
        });
        if (error || !data?.status) {
            const msg =
                error && typeof error === "object" && error !== null
                    ? ((error as { error?: { message?: string } }).error?.message ??
                      (error as { message?: string }).message)
                    : error != null
                      ? String(error)
                      : "Envelope not found";
            return { error: msg ?? "Failed to get envelope" };
        }
        return { status: data.status as EnvelopeStatus };
    } catch (err) {
        console.error("[getEnvelopeStatus] Error:", err);
        return {
            error: err instanceof Error ? err.message : "Failed to get envelope status",
        };
    }
}
