"use server";

import { getClientAndWorkspace } from "../lib/subnoto-client.js";
import { EMBED_BASE_URL } from "../lib/embed-url.js";
import { formatEnvelopeError } from "../lib/format-error.js";
import { getOwnerEmail } from "./whoami.js";

export type CreateEnvelopeFromDevisPdfResult =
    | { envelopeUuid: string; iframeToken: string; host: string }
    | { error: string };

/**
 * Creates an envelope from a devis PDF buffer with Smart Anchor detection.
 * Does NOT call add-blocks; blocks come from Smart Anchors in the PDF.
 */
export async function createEnvelopeFromDevisPdf(
    pdfBase64: string,
    envelopeTitle: string
): Promise<CreateEnvelopeFromDevisPdfResult> {
    const ctx = getClientAndWorkspace();
    if ("error" in ctx) return { error: ctx.error };
    const { client, workspaceUuid, baseUrl } = ctx;

    const owner = await getOwnerEmail();
    if ("error" in owner) return { error: owner.error };
    const signerEmail = owner.email;

    let pdfBuffer: Buffer;
    try {
        pdfBuffer = Buffer.from(pdfBase64, "base64");
    } catch {
        return { error: "Invalid PDF data" };
    }

    try {
        const file = new Blob([new Uint8Array(pdfBuffer)], {
            type: "application/pdf",
        });

        const { data, error: createError } = await client.POST("/public/envelope/create-from-file", {
            body: {
                workspaceUuid,
                envelopeTitle,
                file,
                detectSmartAnchors: "true",
            },
            bodySerializer: (b: {
                workspaceUuid: string;
                envelopeTitle: string;
                file: Blob;
                detectSmartAnchors: string;
            }) => {
                const formData = new FormData();
                formData.append("workspaceUuid", b.workspaceUuid);
                formData.append("envelopeTitle", b.envelopeTitle);
                formData.append("file", b.file, "devis.pdf");
                formData.append("detectSmartAnchors", b.detectSmartAnchors);
                return formData;
            },
        } as Parameters<typeof client.POST>[1]);

        if (createError || !data?.envelopeUuid || !data?.documentUuid) {
            const msg =
                createError && typeof createError === "object" && createError !== null
                    ? ((createError as { error?: { message?: string } }).error?.message ??
                      (createError as { message?: string }).message)
                    : String(createError ?? "Failed to create envelope");
            return { error: msg ?? "Failed to create envelope" };
        }

        const { envelopeUuid } = data;

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
