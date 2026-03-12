"use server";

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { getErrorMessage } from "@subnoto/api-client";
import { formatEnvelopeError } from "../lib/format-error.js";
import { getClientAndWorkspace } from "../lib/subnoto-client.js";
import { getOwnerEmail } from "./whoami.js";

// Resolve .env from project root (relative to this file), not from process.cwd(),
// so Waku/Vite server context always loads the correct .env
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..", "..");
config({ path: join(projectRoot, ".env"), override: true, quiet: true });

const EMBED_BASE_URL = process.env.SUBNOTO_EMBED_BASE_URL ?? "https://app.subnoto.com";
const EMBED_SIGN_PATH = "/embeds/sign";

export { getEnvelopeStatus, type GetEnvelopeStatusResult } from "./envelope-status.js";

export type GetIframeUrlResult = { iframeUrl: string } | { error: string };

export async function getIframeUrlForEnvelope(envelopeUuid: string, signerEmail?: string): Promise<GetIframeUrlResult> {
    const ctx = getClientAndWorkspace();
    if ("error" in ctx) return { error: ctx.error };
    const { client, workspaceUuid } = ctx;
    let email = signerEmail;
    if (email === undefined) {
        const owner = await getOwnerEmail();
        if ("error" in owner) return { error: owner.error };
        email = owner.email;
    }
    try {
        const { data: tokenData, error: tokenError } = await client.POST("/public/authentication/create-iframe-token", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                signerEmail: email,
            },
        });
        if (tokenError || !tokenData?.iframeToken) {
            const msg = tokenError != null ? getErrorMessage(tokenError) : "Failed to create iframe token";
            return { error: msg ?? "Failed to create iframe token" };
        }
        const iframeUrl = `${EMBED_BASE_URL}${EMBED_SIGN_PATH}#t=${tokenData.iframeToken}`;
        return { iframeUrl };
    } catch (err) {
        console.error("[getIframeUrlForEnvelope] Error:", err);
        return {
            error: err instanceof Error ? err.message : "Failed to get signing link",
        };
    }
}

export type CreateEnvelopeResult = { envelopeUuid: string; iframeUrl: string; signerEmail: string } | { error: string };

export async function createEnvelopeAndEmbed(): Promise<CreateEnvelopeResult> {
    console.log("[createEnvelopeAndEmbed] Starting…");

    const ctx = getClientAndWorkspace();
    if ("error" in ctx) {
        console.error("[createEnvelopeAndEmbed] Missing required env vars");
        return { error: ctx.error };
    }
    const { client, workspaceUuid } = ctx;
    const owner = await getOwnerEmail();
    if ("error" in owner) return { error: owner.error };
    const signerEmail = owner.email;
    console.log("[createEnvelopeAndEmbed] Env OK, workspace:", workspaceUuid ?? "(none)");

    const pdfPath = join(projectRoot, "assets", "sample-multipage.pdf");
    if (!existsSync(pdfPath)) {
        console.error("[createEnvelopeAndEmbed] PDF not found:", pdfPath);
        return {
            error: "Missing assets/sample-multipage.pdf. Add it to the assets folder.",
        };
    }

    const fileBuffer = readFileSync(pdfPath);
    console.log("[createEnvelopeAndEmbed] PDF loaded, size:", fileBuffer.length);
    console.log("[createEnvelopeAndEmbed] SubnotoClient created");

    try {
        console.log("[createEnvelopeAndEmbed] Step 1: uploadDocument…");
        const { envelopeUuid, documentUuid } = await client.uploadDocument({
            ...(workspaceUuid && { workspaceUuid }),
            fileBuffer,
            envelopeTitle: "Mass upload signing",
        });
        console.log("[createEnvelopeAndEmbed] Step 1 OK — envelopeUuid:", envelopeUuid, "documentUuid:", documentUuid);

        console.log("[createEnvelopeAndEmbed] Step 2: add-recipients…");
        const { error: addRecipientsError } = await client.POST("/public/envelope/add-recipients", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                recipients: [
                    {
                        type: "manual",
                        email: signerEmail,
                        firstname: "Corentin",
                        lastname: "Subnoto",
                        verificationType: "email",
                    },
                ],
            },
        });
        if (addRecipientsError) {
            console.error("[createEnvelopeAndEmbed] Step 2 failed:", addRecipientsError);
            return { error: getErrorMessage(addRecipientsError) || "Failed to add recipients" };
        }
        console.log("[createEnvelopeAndEmbed] Step 2 OK — recipients added");

        console.log("[createEnvelopeAndEmbed] Step 3: add-blocks (signature)…");
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
            console.error("[createEnvelopeAndEmbed] Step 3 failed:", addBlocksError);
            return { error: getErrorMessage(addBlocksError) || "Failed to add signature block" };
        }
        console.log("[createEnvelopeAndEmbed] Step 3 OK — signature block added");

        console.log("[createEnvelopeAndEmbed] Step 4: send (distributionMethod: none)…");
        const { error: sendError } = await client.POST("/public/envelope/send", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                distributionMethod: "none",
            },
        });
        if (sendError) {
            console.error("[createEnvelopeAndEmbed] Step 4 failed:", sendError);
            return { error: getErrorMessage(sendError) || "Failed to send envelope" };
        }
        console.log("[createEnvelopeAndEmbed] Step 4 OK — envelope sent");

        console.log("[createEnvelopeAndEmbed] Step 5: create-iframe-token…");
        const { data: tokenData, error: tokenError } = await client.POST("/public/authentication/create-iframe-token", {
            body: {
                ...(workspaceUuid && { workspaceUuid }),
                envelopeUuid,
                signerEmail,
            },
        });
        if (tokenError || !tokenData?.iframeToken) {
            console.error("[createEnvelopeAndEmbed] Step 5 failed:", tokenError ?? "no iframeToken");
            const msg = tokenError != null ? getErrorMessage(tokenError) : "Failed to create iframe token";
            return { error: msg ?? "Failed to create iframe token" };
        }
        console.log("[createEnvelopeAndEmbed] Step 5 OK — iframe token received");

        const iframeUrl = `${EMBED_BASE_URL}${EMBED_SIGN_PATH}#t=${tokenData.iframeToken}`;
        console.log("[createEnvelopeAndEmbed] Done — envelopeUuid:", envelopeUuid, "iframeUrl:", iframeUrl);
        return { envelopeUuid, iframeUrl, signerEmail };
    } catch (err) {
        console.error("[createEnvelopeAndEmbed] Error:", err);
        const message = formatEnvelopeError(err);
        return { error: message };
    }
}
