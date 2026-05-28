"use client";

import { useState, useEffect } from "react";
import { createEnvelopeAndEmbed } from "../actions/create-one-envelope";
import { getEnvelopeStatus } from "../actions/envelope-status";
import { getIframeUrlForEnvelope } from "../actions/iframe-token";
import { loadSavedEnvelopes, saveEnvelope } from "../lib/storage-envelopes";
import { CreateEnvelopeCard } from "./create-envelope-card";
import type { EnvelopeListItem } from "./envelope-list";
import { SigningIframe } from "./signing-iframe";

const UNSIGNED_STATUSES = ["draft", "uploading", "approving", "signing"];

export const CreateAndSign = () => {
    const [iframeToken, setIframeToken] = useState<string | null>(null);
    const [embedHost, setEmbedHost] = useState<string | null>(null);
    const [envelopeUuid, setEnvelopeUuid] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [signedMessage, setSignedMessage] = useState<string | null>(null);
    const [savedUnsigned, setSavedUnsigned] = useState<EnvelopeListItem[]>([]);
    const [loadingSaved, setLoadingSaved] = useState(() => loadSavedEnvelopes().length > 0);
    const [hasSavedEnvelopes] = useState(() => loadSavedEnvelopes().length > 0);
    const [openingUuid, setOpeningUuid] = useState<string | null>(null);

    useEffect(() => {
        const list = loadSavedEnvelopes();
        if (list.length === 0) {
            return;
        }
        let cancelled = false;
        (async () => {
            const results: EnvelopeListItem[] = [];
            for (const { envelopeUuid: uuid, signerEmail } of list) {
                if (cancelled) return;
                const result = await getEnvelopeStatus(uuid);
                if (cancelled) return;
                if ("error" in result) continue;
                if (UNSIGNED_STATUSES.includes(result.status)) {
                    const item: EnvelopeListItem = { envelopeUuid: uuid, status: result.status };
                    if (signerEmail !== undefined) item.signerEmail = signerEmail;
                    results.push(item);
                }
            }
            if (!cancelled) {
                setSavedUnsigned(results);
            }
            setLoadingSaved(false);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleCreate = async () => {
        setError(null);
        setLoading(true);
        try {
            const result = await createEnvelopeAndEmbed();
            if ("error" in result) {
                setError(result.error);
                return;
            }
            saveEnvelope(result.envelopeUuid, result.signerEmail);
            setEnvelopeUuid(result.envelopeUuid);
            setIframeToken(result.iframeToken);
            setEmbedHost(result.host);
            setSavedUnsigned((prev) => [
                ...prev.filter((e) => e.envelopeUuid !== result.envelopeUuid),
                { envelopeUuid: result.envelopeUuid, status: "signing" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSaved = async (uuid: string, signerEmail?: string) => {
        setError(null);
        setOpeningUuid(uuid);
        try {
            const result = await getIframeUrlForEnvelope(uuid, signerEmail);
            if ("error" in result) {
                setError(result.error);
                return;
            }
            setEnvelopeUuid(uuid);
            setIframeToken(result.iframeToken);
            setEmbedHost(result.host);
        } finally {
            setOpeningUuid(null);
        }
    };

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // ignore
        }
    };

    const handleDocumentSigned = (payload: { envelopeUuid: string; completed: boolean }) => {
        setSignedMessage(
            payload.completed
                ? "Document signed successfully. All signers have completed the envelope."
                : "Your signature has been recorded. Other signers may still need to sign."
        );
        // Remove from saved unsigned list so it no longer appears as "reopen"
        setSavedUnsigned((prev) => prev.filter((e) => e.envelopeUuid !== payload.envelopeUuid));
    };

    return (
        <div className="flex h-full flex-col">
            {!iframeToken ? (
                <CreateEnvelopeCard
                    loading={loading}
                    onCreate={handleCreate}
                    hasSavedEnvelopes={hasSavedEnvelopes}
                    savedUnsigned={savedUnsigned}
                    loadingSaved={loadingSaved}
                    onOpenSaved={handleOpenSaved}
                    openingUuid={openingUuid}
                    error={error}
                />
            ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-2">
                    {signedMessage && (
                        <div
                            role="alert"
                            className="flex shrink-0 items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                        >
                            <span>{signedMessage}</span>
                            <button
                                type="button"
                                onClick={() => setSignedMessage(null)}
                                className="shrink-0 rounded px-2 py-1 text-green-700 hover:bg-green-100"
                                aria-label="Dismiss"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                    <SigningIframe
                        iframeToken={iframeToken}
                        {...(embedHost !== null ? { host: embedHost } : {})}
                        envelopeUuid={envelopeUuid}
                        onCopy={handleCopy}
                        copied={copied}
                        onDocumentSigned={handleDocumentSigned}
                    />
                </div>
            )}
        </div>
    );
};
