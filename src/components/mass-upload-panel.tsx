"use client";

import { useState } from "react";
import { runMassUpload } from "../actions/mass-upload";
import { getIframeUrlForEnvelope } from "../actions/iframe-token";
import type { MassUploadItem } from "../actions/mass-upload";
import { truncateUuid } from "../lib/uuid";
import { SigningIframe } from "./signing-iframe";

const DEFAULT_COUNT = 10;
const DEFAULT_DELAY_MS = 200;

export function MassUploadPanel() {
    const [count, setCount] = useState(DEFAULT_COUNT);
    const [delayMs, setDelayMs] = useState(DEFAULT_DELAY_MS);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<MassUploadItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [envelopeUuid, setEnvelopeUuid] = useState<string | null>(null);
    const [openingUuid, setOpeningUuid] = useState<string | null>(null);

    const handleRun = async () => {
        setError(null);
        setResults(null);
        setLoading(true);
        try {
            const out = await runMassUpload({ count, delayMs });
            if ("error" in out) {
                setError(out.error);
                return;
            }
            setResults(out.results);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = async (uuid: string) => {
        setError(null);
        setOpeningUuid(uuid);
        try {
            const result = await getIframeUrlForEnvelope(uuid);
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

    const handleCloseIframe = () => {
        setIframeUrl(null);
        setEnvelopeUuid(null);
    };

    if (iframeUrl && envelopeUuid) {
        return (
            <div className="flex h-[calc(100vh-7rem)] flex-col">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-2.5">
                    <button
                        type="button"
                        onClick={handleCloseIframe}
                        className="text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
                    >
                        ← Back to results
                    </button>
                </div>
                <SigningIframe iframeUrl={iframeUrl} envelopeUuid={envelopeUuid} />
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col items-center justify-start p-4 sm:p-6">
            <div className="w-full max-w-2xl rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-semibold tracking-tight text-[rgb(var(--color-text))]">Mass upload</h2>
                <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                    Create multiple envelopes in one go (same PDF, random titles). Then open any in the signing iframe.
                </p>

                <div className="mt-6 flex flex-wrap items-end gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-[rgb(var(--color-text-muted))]">Count</span>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value) || 1)}
                            className="w-24 rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-2 text-sm"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-[rgb(var(--color-text-muted))]">Delay (ms)</span>
                        <input
                            type="number"
                            min={0}
                            max={5000}
                            value={delayMs}
                            onChange={(e) => setDelayMs(Number(e.target.value) || 0)}
                            className="w-24 rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-2 text-sm"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={handleRun}
                        disabled={loading}
                        className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium"
                    >
                        {loading ? (
                            <>
                                <span
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                                    aria-hidden
                                />
                                Running…
                            </>
                        ) : (
                            "Run mass upload"
                        )}
                    </button>
                </div>

                {error && (
                    <div
                        className="mt-4 rounded-lg border border-red-200 bg-[rgb(var(--color-error-bg))] px-4 py-3 text-sm text-red-800"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {results !== null && (
                    <div className="mt-6 border-t border-[rgb(var(--color-border))] pt-6">
                        <h3 className="text-sm font-medium text-[rgb(var(--color-text))]">
                            Results ({results.length})
                        </h3>
                        <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
                            {results.map((item, index) =>
                                "error" in item ? (
                                    <li
                                        key={`err-${index}`}
                                        className="rounded-lg border border-red-200 bg-[rgb(var(--color-error-bg))] px-3 py-2 text-sm text-red-800"
                                    >
                                        {item.error}
                                    </li>
                                ) : (
                                    <li
                                        key={item.envelopeUuid}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-[rgb(var(--color-border))] bg-slate-50/50 px-3 py-2"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <code
                                                title={item.envelopeUuid}
                                                className="block truncate text-xs font-mono text-[rgb(var(--color-text))]"
                                            >
                                                {truncateUuid(item.envelopeUuid)}
                                            </code>
                                            <span className="mt-0.5 block truncate text-xs text-[rgb(var(--color-text-muted))]">
                                                {item.title}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleOpen(item.envelopeUuid)}
                                            disabled={openingUuid !== null}
                                            className="shrink-0 rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-1.5 text-xs font-medium text-[rgb(var(--color-text))] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1 disabled:opacity-50"
                                        >
                                            {openingUuid === item.envelopeUuid ? "Opening…" : "Open"}
                                        </button>
                                    </li>
                                )
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
