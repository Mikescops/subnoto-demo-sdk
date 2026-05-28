"use server";

import { getErrorMessage, type UploadDocumentOptions } from "@subnoto/api-client";
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
    signerEmail: string,
    sellingPolicyBase64: string
): Promise<CreateEnvelopeFromDevisPdfResult> {
    const ctx = getClientAndWorkspace();
    if ("error" in ctx) return { error: ctx.error };
    const { client, workspaceUuid } = ctx;

    let pdfBuffer: Buffer;
    try {
        pdfBuffer = Buffer.from(pdfBase64, "base64");
    } catch {
        return { error: "Invalid PDF data" };
    }

    try {
        const uploadOptions: UploadDocumentOptions = {
            ...(workspaceUuid && { workspaceUuid }),
            fileBuffer: pdfBuffer,
            envelopeTitle,
            detectSmartAnchors: "true",
        };
        const { envelopeUuid, documentUuid: devisDocumentUuid } = await client.uploadDocument(uploadOptions);

        const { error: updateRecipientError } = await client.POST("/public/envelope/update-recipient", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                email: signerEmail,
                role: "signer",
                updates: {
                    verificationType: "email",
                },
            },
        });
        if (updateRecipientError) {
            return { error: getErrorMessage(updateRecipientError) || "Failed to update recipient" };
        }

        // Attach the selling policy (generated client-side) as a second signable document
        const sellingPolicyBuffer = Buffer.from(sellingPolicyBase64, "base64");
        const sellingPolicyBlob = new Blob([sellingPolicyBuffer], { type: "application/pdf" });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: addDocData, error: addDocError } = (await (client.POST as any)(
            "/public/envelope/add-document",
            {
                body: {
                    ...(workspaceUuid && { workspaceUuid }),
                    envelopeUuid,
                    documentTitle: "General Terms and Conditions of Sale",
                    file: sellingPolicyBlob,
                },
                bodySerializer: (body: {
                    workspaceUuid?: string;
                    envelopeUuid: string;
                    documentTitle: string;
                    file: Blob;
                }) => {
                    const form = new FormData();
                    if (body.workspaceUuid) form.append("workspaceUuid", body.workspaceUuid);
                    form.append("envelopeUuid", body.envelopeUuid);
                    form.append("documentTitle", body.documentTitle);
                    form.append("file", body.file, "selling-policy.pdf");
                    return form;
                },
            }
        )) as { data?: { documentUuid: string; revisionEncryptionKey: string }; error?: unknown };

        if (addDocError || !addDocData?.documentUuid) {
            return { error: getErrorMessage(addDocError) || "Failed to add selling policy document" };
        }

        // Add a signature block to the selling policy at the bottom of page 1
        // A4 page is 595×842 pt; with 40 pt padding the signature sits near y=730 from top
        const { error: addBlocksError } = await client.POST("/public/envelope/add-blocks", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                documentUuid: addDocData.documentUuid,
                blocks: [
                    {
                        type: "signature",
                        page: "1",
                        x: 40,
                        y: 730,
                        width: 200,
                        height: 60,
                        recipientEmail: signerEmail,
                    },
                ],
            },
        });
        if (addBlocksError) {
            return { error: getErrorMessage(addBlocksError) || "Failed to add signature block to selling policy" };
        }

        // Require the signer to scroll through all pages on both documents before signing
        const { error: updateDocError } = await client.POST("/public/envelope/update", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                update: {
                    documents: [
                        { uuid: devisDocumentUuid, mustReadAllPages: true },
                        { uuid: addDocData.documentUuid, mustReadAllPages: true },
                    ],
                },
            },
        });
        if (updateDocError) {
            return { error: getErrorMessage(updateDocError) || "Failed to enable mustReadAllPages on selling policy" };
        }

        const { error: sendError } = await client.POST("/public/envelope/send", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                distributionMethod: "none",
            },
        });
        if (sendError) {
            return { error: getErrorMessage(sendError) || "Failed to send envelope" };
        }

        const { data: tokenData, error: tokenError } = await client.POST("/public/authentication/create-iframe-token", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                signerEmail,
            },
        });
        if (tokenError || !tokenData?.iframeToken) {
            const msg = tokenError != null ? getErrorMessage(tokenError) : "Failed to create iframe token";
            return { error: msg ?? "Failed to create iframe token" };
        }

        const iframeToken = tokenData.iframeToken;
        return { envelopeUuid, iframeToken, host: EMBED_BASE_URL };
    } catch (err) {
        return {
            error: formatEnvelopeError(err),
        };
    }
}
