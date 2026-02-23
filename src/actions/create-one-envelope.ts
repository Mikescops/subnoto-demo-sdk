"use server";

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { SubnotoClient } from "@subnoto/api-client";
import { getClientAndWorkspace } from "../lib/subnoto-client.js";
import { getProjectRoot } from "../lib/env.js";
import { buildEmbedSignUrl } from "../lib/embed-url.js";
import { formatEnvelopeError } from "../lib/format-error.js";
import { getOwnerEmail } from "./whoami.js";

export type CreateEnvelopeFromBufferResult =
  | { envelopeUuid: string; documentUuid: string }
  | { error: string };

/** Creates one envelope from a buffer: upload, add recipients, add signature block, send. signerEmail is the API key owner email (e.g. from getOwnerEmail). */
export async function createEnvelopeFromBuffer(
  client: SubnotoClient,
  workspaceUuid: string,
  fileBuffer: Buffer,
  envelopeTitle: string,
  signerEmail: string,
): Promise<CreateEnvelopeFromBufferResult> {
  try {
    const { envelopeUuid, documentUuid } = await client.uploadDocument({
      workspaceUuid,
      fileBuffer,
      envelopeTitle,
    });

    const { error: addRecipientsError } = await client.POST(
      "/public/envelope/add-recipients",
      {
        body: {
          workspaceUuid,
          envelopeUuid,
          recipients: [
            {
              type: "manual",
              email: signerEmail,
              firstname: "Demo",
              lastname: "Signer",
            },
          ],
        },
      },
    );
    if (addRecipientsError) {
      const msg =
        typeof addRecipientsError === "object" && addRecipientsError !== null
          ? ((addRecipientsError as { error?: { message?: string } }).error
              ?.message ??
            (addRecipientsError as { message?: string }).message)
          : String(addRecipientsError);
      return { error: msg ?? "Failed to add recipients" };
    }

    const { error: addBlocksError } = await client.POST(
      "/public/envelope/add-blocks",
      {
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
      },
    );
    if (addBlocksError) {
      const msg =
        typeof addBlocksError === "object" && addBlocksError !== null
          ? ((addBlocksError as { error?: { message?: string } }).error
              ?.message ??
            (addBlocksError as { message?: string }).message)
          : String(addBlocksError);
      return { error: msg ?? "Failed to add signature block" };
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

    return { envelopeUuid, documentUuid };
  } catch (err) {
    const ctx = getClientAndWorkspace();
    const baseUrl = "error" in ctx ? "" : ctx.baseUrl;
    return {
      error: formatEnvelopeError(err, baseUrl),
    };
  }
}

export type CreateEnvelopeResult =
  | { envelopeUuid: string; iframeUrl: string; signerEmail: string }
  | { error: string };

export async function createEnvelopeAndEmbed(
  envelopeTitle = "Mass upload signing",
): Promise<CreateEnvelopeResult> {
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

  const fileBuffer = readFileSync(pdfPath) as Buffer;
  const result = await createEnvelopeFromBuffer(
    client,
    workspaceUuid,
    fileBuffer,
    envelopeTitle,
    signerEmail,
  );
  if ("error" in result) return { error: result.error };
  const { envelopeUuid } = result;

  const { data: tokenData, error: tokenError } = await client.POST(
    "/public/authentication/create-iframe-token",
    {
      body: {
        workspaceUuid,
        envelopeUuid,
        signerEmail,
      },
    },
  );
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

  const iframeUrl = buildEmbedSignUrl(tokenData.iframeToken);
  return { envelopeUuid, iframeUrl, signerEmail };
}
