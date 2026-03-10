"use server";

import type { UploadDocumentOptions } from "@subnoto/api-client";
import { getClientAndWorkspace } from "../lib/subnoto-client.js";
import { EMBED_BASE_URL } from "../lib/embed-url.js";
import { formatEnvelopeError } from "../lib/format-error.js";

export type CreateEnvelopeFromDevisPdfResult =
    | { envelopeUuid: string; iframeToken: string; host: string }
    | { error: string };

/**
 * Creates an envelope from a devis PDF buffer with Smart Anchor detection.
 * Does NOT call add-blocks; blocks come from Smart Anchors in the PDF.
 * After creation, updates the auto-detected recipient to use verificationType "email".
 */
export async function createEnvelopeFromDevisPdf(
    pdfBase64: string,
    envelopeTitle: string,
    signerEmail: string
): Promise<CreateEnvelopeFromDevisPdfResult> {
    const ctx = getClientAndWorkspace();
    if ("error" in ctx) return { error: ctx.error };
    const { client, workspaceUuid, baseUrl } = ctx;

    let pdfBuffer: Buffer;
    try {
        pdfBuffer = Buffer.from(pdfBase64, "base64");
    } catch {
        return { error: "Invalid PDF data" };
    }

    try {
        const uploadOptions: UploadDocumentOptions = {
            workspaceUuid,
            fileBuffer: pdfBuffer,
            envelopeTitle,
            detectSmartAnchors: "true",
        };
        const { envelopeUuid } = await client.uploadDocument(uploadOptions);

        const post = client as { POST: (path: string, opts: { body: object }) => Promise<{ error: unknown }> };
        const { error: updateRecipientError } = await post.POST("/public/envelope/update-recipient", {
            body: {
                workspaceUuid,
                envelopeUuid,
                email: signerEmail,
                role: "signer",
                updates: {
                    verificationType: "email",
                },
            },
        });
        if (updateRecipientError) {
            const msg =
                typeof updateRecipientError === "object" && updateRecipientError !== null
                    ? ((updateRecipientError as { error?: { message?: string } }).error?.message ??
                      (updateRecipientError as { message?: string }).message)
                    : String(updateRecipientError);
            return { error: msg ?? "Failed to update recipient" };
        }

        const { error: sendError } = await client.POST("/public/envelope/send", {
            body: {
                workspaceUuid,
                envelopeUuid,
                distributionMethod: "none",
            },
        });
        if (sendError) {
            const msg =
                typeof sendError === "object" && sendError !== null
                    ? ((sendError as { error?: { message?: string } }).error?.message ??
                      (sendError as { message?: string }).message)
                    : String(sendError);
            return { error: msg ?? "Failed to send envelope" };
        }

        const { data: tokenData, error: tokenError } = await client.POST("/public/authentication/create-iframe-token", {
            body: {
                workspaceUuid,
                envelopeUuid,
                signerEmail,
            },
        });
        if (tokenError || !tokenData?.iframeToken) {
            const msg =
                tokenError && typeof tokenError === "object" && tokenError !== null
                    ? ((tokenError as { error?: { message?: string } }).error?.message ??
                      (tokenError as { message?: string }).message)
                    : tokenError != null
                      ? String(tokenError)
                      : "Failed to create iframe token";
            return { error: msg ?? "Failed to create iframe token" };
        }

        const iframeToken = tokenData.iframeToken;
        return { envelopeUuid, iframeToken, host: EMBED_BASE_URL };
    } catch (err) {
        return {
            error: formatEnvelopeError(err, baseUrl),
        };
    }
}
