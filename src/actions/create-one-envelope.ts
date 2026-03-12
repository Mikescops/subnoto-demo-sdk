"use server";

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getErrorMessage, type SubnotoClient } from "@subnoto/api-client";
import { getClientAndWorkspace } from "../lib/subnoto-client.js";
import { getProjectRoot } from "../lib/env.js";
import { EMBED_BASE_URL } from "../lib/embed-url.js";
import { formatEnvelopeError } from "../lib/format-error.js";
import { getOwnerEmail } from "./whoami.js";

export type CreateEnvelopeFromBufferResult = { envelopeUuid: string; documentUuid: string } | { error: string };

/** Creates one envelope from a buffer: upload, add recipients, add signature block, send. signerEmail is the API key owner email (e.g. from getOwnerEmail). */
export async function createEnvelopeFromBuffer(
    client: SubnotoClient,
    workspaceUuid: string | undefined,
    fileBuffer: Buffer,
    envelopeTitle: string,
    signerEmail: string
): Promise<CreateEnvelopeFromBufferResult> {
    try {
        const { envelopeUuid, documentUuid } = await client.uploadDocument({
            ...(workspaceUuid && { workspaceUuid }),
            fileBuffer,
            envelopeTitle,
        });

        const { error: addRecipientsError } = await client.POST("/public/envelope/add-recipients", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                recipients: [
                    {
                        type: "manual",
                        email: signerEmail,
                        firstname: "Demo",
                        lastname: "Signer",
                        verificationType: "email",
                    },
                ],
            },
        });
        if (addRecipientsError) {
            return { error: getErrorMessage(addRecipientsError) || "Failed to add recipients" };
        }

        const { error: addBlocksError } = await client.POST("/public/envelope/add-blocks", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                documentUuid,
                blocks: [
                    {
                        type: "signature",
                        page: "1",
                        x: 100,
                        y: 400,
                        recipientEmail: signerEmail,
                    },
                ],
            },
        });
        if (addBlocksError) {
            return { error: getErrorMessage(addBlocksError) || "Failed to add signature block" };
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

        return { envelopeUuid, documentUuid };
    } catch (err) {
        return {
            error: formatEnvelopeError(err),
        };
    }
}

export type CreateEnvelopeResult =
    | { envelopeUuid: string; iframeToken: string; host: string; signerEmail: string }
    | { error: string };

export async function createEnvelopeAndEmbed(envelopeTitle = "Mass upload signing"): Promise<CreateEnvelopeResult> {
    const ctx = getClientAndWorkspace();
    if ("error" in ctx) return { error: ctx.error };
    const { client, workspaceUuid } = ctx;

    const owner = await getOwnerEmail();
    if ("error" in owner) return { error: owner.error };
    const signerEmail = owner.email;

    const pdfPath = join(getProjectRoot(), "assets", "sample-multipage.pdf");
    if (!existsSync(pdfPath)) {
        return { error: "Missing assets/sample-multipage.pdf. Add it to the assets folder." };
    }

    const fileBuffer = readFileSync(pdfPath);
    const result = await createEnvelopeFromBuffer(client, workspaceUuid, fileBuffer, envelopeTitle, signerEmail);
    if ("error" in result) return { error: result.error };
    const { envelopeUuid } = result;

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
    return { envelopeUuid, iframeToken, host: EMBED_BASE_URL, signerEmail };
}
