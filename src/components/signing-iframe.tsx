"use client";

import { useEffect } from "react";
import { SignEmbed } from "@subnoto/embed-react";
import { truncateUuid } from "../lib/uuid.js";

const DEFAULT_EMBED_ORIGIN = "https://app.subnoto.com";

/**
 * postMessage(message, "*") from the iframe is fine: the parent still receives the message.
 * If you never get subnoto:documentSigned, the embed may be sending from a *nested* iframe
 * (so the message goes to the embed's top frame, not to this window). The embed app must
 * call window.parent.postMessage(...) from its top-level document, or forward the event.
 */

function normalizeOrigin(url: string): string {
    return url.replace(/\/$/, "").toLowerCase();
}

function isEmbedDebugEnabled(): boolean {
    return true;
}

export type DocumentSignedPayload = {
    envelopeUuid: string;
    completed: boolean;
    workspaceUuid?: string;
};

type SigningIframeProps = {
    iframeToken: string;
    host?: string;
    envelopeUuid?: string | null;
    onCopy?: (text: string) => void;
    copied?: boolean;
    onDocumentSigned?: (payload: DocumentSignedPayload) => void;
};

export function SigningIframe({
    iframeToken,
    host,
    envelopeUuid,
    onCopy,
    copied = false,
    onDocumentSigned,
}: SigningIframeProps) {
    const embedOrigin = host ?? DEFAULT_EMBED_ORIGIN;

    useEffect(() => {
        const expectedOrigin = normalizeOrigin(embedOrigin);
        const debug = isEmbedDebugEnabled();
        console.log("[Subnoto embed] listener attached", { expectedOrigin, debug });

        const handleMessage = (event: MessageEvent) => {
            const originNorm = normalizeOrigin(event.origin);

            if (
                debug &&
                event.data &&
                typeof event.data === "object" &&
                (event.data.type !== undefined || originNorm === expectedOrigin)
            ) {
                console.log("[Subnoto embed] postMessage received", {
                    origin: event.origin,
                    type: event.data?.type,
                    payload: event.data?.payload,
                    fullData: event.data,
                });
            }

            if (event.data?.type !== "subnoto:documentSigned") return;

            const isLocalhost =
                typeof window !== "undefined" &&
                (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
            const originOk = originNorm === expectedOrigin || isLocalhost;

            if (!originOk) {
                if (debug) {
                    console.warn(
                        "[Subnoto embed] Ignored subnoto:documentSigned (origin mismatch). Expected:",
                        expectedOrigin,
                        "Got:",
                        event.origin
                    );
                }
                return;
            }

            const payload = event.data.payload;
            if (payload && typeof payload.envelopeUuid === "string" && typeof payload.completed === "boolean") {
                onDocumentSigned?.({
                    envelopeUuid: payload.envelopeUuid,
                    completed: payload.completed,
                    workspaceUuid: typeof payload.workspaceUuid === "string" ? payload.workspaceUuid : undefined,
                });
            } else if (debug) {
                console.warn("[Subnoto embed] subnoto:documentSigned received but invalid payload", event.data);
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [embedOrigin, onDocumentSigned]);

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {envelopeUuid && (
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-2.5 shadow-sm">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[rgb(var(--color-primary))] text-xs font-semibold text-white">
                            S
                        </div>
                        <span className="text-sm font-medium text-[rgb(var(--color-text-muted))]">Subnoto</span>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
                        <code
                            title={envelopeUuid}
                            className="max-w-32 truncate rounded bg-slate-100 px-2 py-1 text-xs font-mono text-[rgb(var(--color-text))] sm:max-w-none"
                        >
                            {truncateUuid(envelopeUuid)}
                        </code>
                        {onCopy && (
                            <button
                                type="button"
                                onClick={() => onCopy(envelopeUuid)}
                                className="shrink-0 rounded-md border border-[rgb(var(--color-border))] bg-white px-2.5 py-1 text-xs font-medium text-[rgb(var(--color-text))] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1"
                            >
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        )}
                    </div>
                </div>
            )}
            <SignEmbed
                token={iframeToken}
                {...(host !== undefined && host !== "" ? { host } : {})}
                title="Subnoto signing"
                className="min-h-0 w-full flex-1"
            />
        </div>
    );
}
