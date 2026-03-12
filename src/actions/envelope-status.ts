"use server";

import { getErrorMessage } from "@subnoto/api-client";
import { getClientAndWorkspace } from "../lib/subnoto-client.js";

const ENVELOPE_STATUSES = [
    "uploading",
    "draft",
    "approving",
    "signing",
    "complete",
    "declined",
    "canceled",
] as const;

export type EnvelopeStatus = (typeof ENVELOPE_STATUSES)[number];

const ENVELOPE_STATUS_SET = new Set<string>(ENVELOPE_STATUSES);

function isEnvelopeStatus(s: string): s is EnvelopeStatus {
    return ENVELOPE_STATUS_SET.has(s);
}

export type GetEnvelopeStatusResult = { status: EnvelopeStatus } | { error: string };

export async function getEnvelopeStatus(envelopeUuid: string): Promise<GetEnvelopeStatusResult> {
    const ctx = getClientAndWorkspace();
    if ("error" in ctx) return { error: ctx.error };
    const { client, workspaceUuid } = ctx;
    try {
        const { data, error } = await client.POST("/public/envelope/get", {
            body: { ...(workspaceUuid && { workspaceUuid }), envelopeUuid },
        });
        if (error || !data?.status) {
            const msg = error != null ? getErrorMessage(error) : "Envelope not found";
            return { error: msg ?? "Failed to get envelope" };
        }
        if (!isEnvelopeStatus(data.status)) {
            return { error: "Invalid envelope status" };
        }
        return { status: data.status };
    } catch (err) {
        console.error("[getEnvelopeStatus] Error:", err);
        return {
            error: err instanceof Error ? err.message : "Failed to get envelope status",
        };
    }
}
