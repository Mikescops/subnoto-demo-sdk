"use server";

import { getErrorMessage } from "@subnoto/api-client";
import { getClientAndWorkspace } from "../lib/subnoto-client.js";
import { EMBED_BASE_URL } from "../lib/embed-url.js";
import { formatEnvelopeError } from "../lib/format-error.js";

export type CreateRentContractEnvelopeResult =
    | { envelopeUuid: string; iframeToken: string; host: string }
    | { error: string };

// 3 blocks on page 1 only (A4 = 595×842pt, padding 40pt).
// Label column x=40, input column x=240 width=315.
const BLOCKS = [
    { type: "textInput" as const, page: "1", x: 240, y: 596, width: 315, height: 22,
      placeholder: "Your full legal name", required: true },
    { type: "date" as const,      page: "1", x: 240, y: 632, width: 315, height: 22,
      required: true },
    { type: "checkbox" as const,  page: "1", x: 40,  y: 668, width: 14,  height: 14,
      required: true },
] as const;

export async function createRentContractEnvelope(
    pdfBase64: string,
    tenantEmail: string,
    tenantName: string
): Promise<CreateRentContractEnvelopeResult> {
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
        const { envelopeUuid, documentUuid } = await client.uploadDocument({
            ...(workspaceUuid && { workspaceUuid }),
            fileBuffer: pdfBuffer,
            envelopeTitle: `Rental Agreement — ${tenantName || tenantEmail}`,
            detectSmartAnchors: "true",
        });

        // Update the auto-detected recipient to use email verification
        const { error: updateRecipientError } = await client.POST("/public/envelope/update-recipient", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                email: tenantEmail,
                role: "signer",
                updates: { verificationType: "email" },
            },
        });
        if (updateRecipientError) {
            return { error: getErrorMessage(updateRecipientError) ?? "Failed to update recipient" };
        }

        const allBlocks = BLOCKS.map((b) => ({ ...b, recipientEmail: tenantEmail }));

        const { error: addBlocksError } = await client.POST("/public/envelope/add-blocks", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                documentUuid,
                blocks: allBlocks,
            },
        });
        if (addBlocksError) {
            return { error: getErrorMessage(addBlocksError) ?? "Failed to add input blocks" };
        }

        const { error: sendError } = await client.POST("/public/envelope/send", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                distributionMethod: "none",
            },
        });
        if (sendError) {
            return { error: getErrorMessage(sendError) ?? "Failed to send envelope" };
        }

        const { data: tokenData, error: tokenError } = await client.POST(
            "/public/authentication/create-iframe-token",
            {
                body: {
                    ...(workspaceUuid && { workspaceUuid }),
                    envelopeUuid,
                    signerEmail: tenantEmail,
                },
            }
        );
        if (tokenError || !tokenData?.iframeToken) {
            return { error: getErrorMessage(tokenError) ?? "Failed to create iframe token" };
        }

        return { envelopeUuid, iframeToken: tokenData.iframeToken, host: EMBED_BASE_URL };
    } catch (err) {
        return { error: formatEnvelopeError(err) };
    }
}
