"use server";

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { SubnotoClient, SubnotoError } from "@subnoto/api-client";
import { getOwnerEmail } from "./whoami.js";

// Resolve .env from project root (relative to this file), not from process.cwd(),
// so Waku/Vite server context always loads the correct .env
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..", "..");
config({ path: join(projectRoot, ".env"), override: true, quiet: true });

const EMBED_BASE_URL = process.env.SUBNOTO_EMBED_BASE_URL ?? "https://app.subnoto.com";
const EMBED_SIGN_PATH = "/embeds/sign";

type EnvelopeStatus = "uploading" | "draft" | "approving" | "signing" | "complete" | "declined" | "canceled";

function getClientAndWorkspace():
    | {
          client: SubnotoClient;
          workspaceUuid: string;
          baseUrl: string;
      }
    | { error: string } {
    const apiBaseUrl = process.env.SUBNOTO_BASE_URL;
    const accessKey = process.env.SUBNOTO_ACCESS_KEY;
    const secretKey = process.env.SUBNOTO_SECRET_KEY;
    const workspaceUuid = process.env.WORKSPACE_UUID;
    if (!apiBaseUrl || !accessKey || !secretKey || !workspaceUuid) {
        return {
            error: "Missing env: SUBNOTO_BASE_URL, SUBNOTO_ACCESS_KEY, SUBNOTO_SECRET_KEY, WORKSPACE_UUID",
        };
    }
    const client = new SubnotoClient({
        apiBaseUrl,
        accessKey,
        secretKey,
        unattested: process.env.SUBNOTO_UNATTESTED === "true",
    });
    return { client, workspaceUuid, baseUrl: apiBaseUrl };
}

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
                workspaceUuid,
                envelopeUuid,
                signerEmail: email,
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
    const { client, workspaceUuid, baseUrl } = ctx;
    const owner = await getOwnerEmail();
    if ("error" in owner) return { error: owner.error };
    const signerEmail = owner.email;
    console.log("[createEnvelopeAndEmbed] Env OK, baseUrl:", baseUrl, "workspace:", workspaceUuid);

    const pdfPath = join(projectRoot, "assets", "sample-multipage.pdf");
    if (!existsSync(pdfPath)) {
        console.error("[createEnvelopeAndEmbed] PDF not found:", pdfPath);
        return {
            error: "Missing assets/sample-multipage.pdf. Add it to the assets folder.",
        };
    }

    const fileBuffer = readFileSync(pdfPath) as Buffer;
    console.log("[createEnvelopeAndEmbed] PDF loaded, size:", fileBuffer.length);
    console.log("[createEnvelopeAndEmbed] SubnotoClient created");

    try {
        console.log("[createEnvelopeAndEmbed] Step 1: uploadDocument…");
        const { envelopeUuid, documentUuid } = await client.uploadDocument({
            workspaceUuid,
            fileBuffer,
            envelopeTitle: "Mass upload signing",
        });
        console.log("[createEnvelopeAndEmbed] Step 1 OK — envelopeUuid:", envelopeUuid, "documentUuid:", documentUuid);

        console.log("[createEnvelopeAndEmbed] Step 2: add-recipients…");
        const { error: addRecipientsError } = await client.POST("/public/envelope/add-recipients", {
            body: {
                workspaceUuid,
                envelopeUuid,
                recipients: [
                    {
                        type: "manual",
                        email: signerEmail,
                        firstname: "Corentin",
                        lastname: "Subnoto",
                    },
                ],
            },
        });
        if (addRecipientsError) {
            console.error("[createEnvelopeAndEmbed] Step 2 failed:", addRecipientsError);
            const msg =
                typeof addRecipientsError === "object" && addRecipientsError !== null
                    ? ((addRecipientsError as { error?: { message?: string } }).error?.message ??
                      (addRecipientsError as { message?: string }).message)
                    : String(addRecipientsError);
            return { error: msg ?? "Failed to add recipients" };
        }
        console.log("[createEnvelopeAndEmbed] Step 2 OK — recipients added");

        console.log("[createEnvelopeAndEmbed] Step 3: add-blocks (signature)…");
        const { error: addBlocksError } = await client.POST("/public/envelope/add-blocks", {
            body: {
                workspaceUuid,
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
            const msg =
                typeof addBlocksError === "object" && addBlocksError !== null
                    ? ((addBlocksError as { error?: { message?: string } }).error?.message ??
                      (addBlocksError as { message?: string }).message)
                    : String(addBlocksError);
            return { error: msg ?? "Failed to add signature block" };
        }
        console.log("[createEnvelopeAndEmbed] Step 3 OK — signature block added");

        console.log("[createEnvelopeAndEmbed] Step 4: send (distributionMethod: none)…");
        const { error: sendError } = await client.POST("/public/envelope/send", {
            body: {
                workspaceUuid,
                envelopeUuid,
                distributionMethod: "none",
            },
        });
        if (sendError) {
            console.error("[createEnvelopeAndEmbed] Step 4 failed:", sendError);
            const msg =
                typeof sendError === "object" && sendError !== null
                    ? ((sendError as { error?: { message?: string } }).error?.message ??
                      (sendError as { message?: string }).message)
                    : String(sendError);
            return { error: msg ?? "Failed to send envelope" };
        }
        console.log("[createEnvelopeAndEmbed] Step 4 OK — envelope sent");

        console.log("[createEnvelopeAndEmbed] Step 5: create-iframe-token…");
        const { data: tokenData, error: tokenError } = await client.POST("/public/authentication/create-iframe-token", {
            body: {
                workspaceUuid,
                envelopeUuid,
                signerEmail,
            },
        });
        if (tokenError || !tokenData?.iframeToken) {
            console.error("[createEnvelopeAndEmbed] Step 5 failed:", tokenError ?? "no iframeToken");
            const msg =
                tokenError && typeof tokenError === "object" && tokenError !== null
                    ? ((tokenError as { error?: { message?: string } }).error?.message ??
                      (tokenError as { message?: string }).message)
                    : tokenError != null
                      ? String(tokenError)
                      : "Failed to create iframe token";
            return { error: msg ?? "Failed to create iframe token" };
        }
        console.log("[createEnvelopeAndEmbed] Step 5 OK — iframe token received");

        const iframeUrl = `${EMBED_BASE_URL}${EMBED_SIGN_PATH}#t=${tokenData.iframeToken}`;
        console.log("[createEnvelopeAndEmbed] Done — envelopeUuid:", envelopeUuid, "iframeUrl:", iframeUrl);
        return { envelopeUuid, iframeUrl, signerEmail };
    } catch (err) {
        console.error("[createEnvelopeAndEmbed] Error:", err);
        const message = formatEnvelopeError(err, baseUrl);
        return { error: message };
    }
}

function formatEnvelopeError(err: unknown, apiBaseUrl: string): string {
    if (err instanceof SubnotoError) {
        if (/no session id/i.test(err.message)) {
            const hint =
                apiBaseUrl.startsWith("http://") && apiBaseUrl.includes("enclave.subnoto.com")
                    ? " Use HTTPS: set SUBNOTO_BASE_URL=https://enclave.subnoto.com in .env"
                    : "";
            return `Subnoto API handshake failed: ${err.message}.${hint}`;
        }
        return err.message;
    }
    if (err instanceof Error) {
        const cause = (err as Error & { cause?: unknown }).cause;
        const code = cause && typeof cause === "object" && "code" in cause ? (cause as { code?: string }).code : null;
        if (err.message.includes("fetch failed") || code === "ECONNREFUSED") {
            return `Cannot reach Subnoto API at ${apiBaseUrl}. Check that the API or tunnel is running (e.g. start the api-proxy or use the cloud URL such as https://enclave.subnoto.com).`;
        }
        return err.message;
    }
    return "Unknown error creating envelope";
}
