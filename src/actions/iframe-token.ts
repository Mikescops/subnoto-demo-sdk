"use server";

import { getClientAndWorkspace } from "../lib/subnoto-client.js";
import { buildEmbedSignUrl } from "../lib/embed-url.js";
import { getOwnerEmail } from "./whoami.js";

export type GetIframeUrlResult = { iframeUrl: string } | { error: string };

export async function getIframeUrlForEnvelope(
  envelopeUuid: string,
  signerEmail?: string,
): Promise<GetIframeUrlResult> {
  const ctx = getClientAndWorkspace();
  if ("error" in ctx) return { error: ctx.error };
  const { client, workspaceUuid } = ctx;
  let email = signerEmail;
  if (!email) {
    const owner = await getOwnerEmail();
    if ("error" in owner) return { error: owner.error };
    email = owner.email;
  }
  try {
    const { data: tokenData, error: tokenError } = await client.POST(
      "/public/authentication/create-iframe-token",
      {
        body: {
          workspaceUuid,
          envelopeUuid,
          signerEmail: email,
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
    return { iframeUrl };
  } catch (err) {
    console.error("[getIframeUrlForEnvelope] Error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to get signing link",
    };
  }
}
