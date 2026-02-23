"use server";

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getClientAndWorkspace } from "../lib/subnoto-client.js";
import { getProjectRoot } from "../lib/env.js";
import { createEnvelopeFromBuffer } from "./create-one-envelope.js";
import { getOwnerEmail } from "./whoami.js";

const TITLE_PARTS = [
    ["Q4 2024", "Q1 2025", "FY2024", "H2 2024", "January 2025", "Board"],
    ["Financial Report", "Audit Summary", "Compliance Review", "Due Diligence", "Risk Assessment", "Budget Overview"],
    ["Contract Amendment", "NDA", "Vendor Agreement", "SOW", "MSA", "Addendum"],
    ["— Acme Corp", "— Confidential", "— Final", "— Signed", "— Draft", "— Rev. 2"],
];

function randomProTitle(): string {
    const parts = TITLE_PARTS.map((arr) => arr[Math.floor(Math.random() * arr.length)]);
    return parts.join(" ");
}

export type MassUploadItem = { envelopeUuid: string; documentUuid: string; title: string } | { error: string };

export type RunMassUploadResult = { results: MassUploadItem[] } | { error: string };

export async function runMassUpload(options: { count: number; delayMs: number }): Promise<RunMassUploadResult> {
    const { count, delayMs } = options;

    const ctx = getClientAndWorkspace();
    if ("error" in ctx) return { error: ctx.error };
    const { client, workspaceUuid } = ctx;

    const pdfPath = join(getProjectRoot(), "assets", "sample-multipage.pdf");
    if (!existsSync(pdfPath)) {
        return { error: "Missing assets/sample-multipage.pdf. Add it to the assets folder." };
    }

    const owner = await getOwnerEmail();
    if ("error" in owner) return { error: owner.error };
    const signerEmail = owner.email;

    const fileBuffer = readFileSync(pdfPath) as Buffer;
    const results: MassUploadItem[] = [];

    for (let i = 0; i < count; i++) {
        const title = randomProTitle();
        const result = await createEnvelopeFromBuffer(client, workspaceUuid, fileBuffer, title, signerEmail);
        if ("error" in result) {
            results.push({ error: result.error });
        } else {
            results.push({
                envelopeUuid: result.envelopeUuid,
                documentUuid: result.documentUuid,
                title,
            });
        }
        if (i < count - 1) {
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }

    return { results };
}
