"use client";

import { truncateUuid } from "../lib/uuid.js";

export type EnvelopeListItem = { envelopeUuid: string; status: string; signerEmail?: string };

type EnvelopeListProps = {
    items: EnvelopeListItem[];
    loading: boolean;
    onOpen: (uuid: string, signerEmail?: string) => void;
    openingUuid: string | null;
};

export function EnvelopeList({ items, loading, onOpen, openingUuid }: EnvelopeListProps) {
    if (loading) {
        return <p className="mt-3 text-sm text-[rgb(var(--color-text-muted))]">Loading…</p>;
    }
    if (items.length === 0) {
        return (
            <p className="mt-3 text-sm text-[rgb(var(--color-text-muted))]">
                No unsigned envelopes. All saved envelopes are complete.
            </p>
        );
    }
    return (
        <ul className="mt-3 space-y-2">
            {items.map(({ envelopeUuid: uuid, status, signerEmail }) => (
                <li
                    key={uuid}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[rgb(var(--color-border))] bg-slate-50/50 px-3 py-2"
                >
                    <div className="min-w-0 flex-1">
                        <code title={uuid} className="block truncate text-xs font-mono text-[rgb(var(--color-text))]">
                            {truncateUuid(uuid)}
                        </code>
                        <span className="mt-0.5 inline-block text-xs text-[rgb(var(--color-text-muted))] capitalize">
                            {status}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onOpen(uuid, signerEmail)}
                        disabled={openingUuid !== null}
                        className="shrink-0 rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-1.5 text-xs font-medium text-[rgb(var(--color-text))] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1 disabled:opacity-50"
                    >
                        {openingUuid === uuid ? "Opening…" : "Open"}
                    </button>
                </li>
            ))}
        </ul>
    );
}
