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
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [envelopeUuid, setEnvelopeUuid] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [savedUnsigned, setSavedUnsigned] = useState<EnvelopeListItem[]>([]);
    const [loadingSaved, setLoadingSaved] = useState(true);
    const [hasSavedEnvelopes, setHasSavedEnvelopes] = useState(false);
    const [openingUuid, setOpeningUuid] = useState<string | null>(null);

    useEffect(() => {
        const list = loadSavedEnvelopes();
        setHasSavedEnvelopes(list.length > 0);
        if (list.length === 0) {
            setLoadingSaved(false);
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
            setIframeUrl(result.iframeUrl);
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
            setIframeUrl(result.iframeUrl);
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

    return (
        <div className="flex h-[calc(100vh-7rem)] flex-col">
            {!iframeUrl ? (
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
                <SigningIframe iframeUrl={iframeUrl} envelopeUuid={envelopeUuid} onCopy={handleCopy} copied={copied} />
            )}
        </div>
    );
};
