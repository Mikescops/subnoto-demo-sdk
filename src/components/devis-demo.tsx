"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { createEnvelopeFromDevisPdf } from "../actions/create-devis-envelope.js";
import { getOwnerEmail } from "../actions/whoami.js";
import { saveEnvelope } from "../lib/storage-envelopes.js";
import { SigningIframe } from "./signing-iframe.js";
import { DevisPdfDocument } from "./devis-pdf-document.js";
import type { DevisFormData, DevisLineItem } from "./devis-types.js";

const DEBOUNCE_MS = 500;

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
    if (arr.length === 0) throw new Error("pick() requires a non-empty array");
    const index = Math.floor(Math.random() * arr.length);
    const item = arr[index];
    if (item === undefined) throw new Error("pick() requires a non-empty array");
    return item;
}

function getDefaultClientCompanyAddress() {
    const firstNames = ["James", "Emma", "Oliver", "Sophie", "Liam", "Charlotte"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Taylor"];
    const companies = ["Tech Solutions Ltd", "Web Agency Pro", "Creative Studio", "Consulting & Co"];
    const streets = ["12 Main Street", "5 Oak Avenue", "8 Park Lane", "3 Market Square"];
    const cities = ["London", "Manchester", "Birmingham", "Leeds"];
    return {
        clientName: `${pick(firstNames)} ${pick(lastNames)}`,
        company: pick(companies),
        address: `${pick(streets)}, ${pick(cities)}`,
    };
}

function defaultFormData(signerEmail = ""): DevisFormData {
    const today = new Date().toISOString().slice(0, 10);
    const validity = new Date();
    validity.setDate(validity.getDate() + 30);
    const { clientName, company, address } = getDefaultClientCompanyAddress();
    return {
        quoteNumber: `QT-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        quoteDate: today,
        validityDate: validity.toISOString().slice(0, 10),
        clientName,
        company,
        address,
        signerEmail,
        lineItems: [{ id: "1", description: "", quantity: 1, unitPrice: 0, amount: 0 }],
        taxRatePercent: 20,
    };
}

function dummyFormData(signerEmail: string): DevisFormData {
    const firstNames = ["James", "Emma", "Oliver", "Sophie", "Liam", "Charlotte"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Taylor"];
    const companies = ["Tech Solutions Ltd", "Web Agency Pro", "Creative Studio", "Consulting & Co"];
    const streets = ["12 Main Street", "5 Oak Avenue", "8 Park Lane", "3 Market Square"];
    const cities = ["London", "Manchester", "Birmingham", "Leeds"];
    const items = [
        { desc: "Web development", min: 800, max: 3000 },
        { desc: "Interface design", min: 400, max: 1200 },
        { desc: "API integration", min: 500, max: 2000 },
        { desc: "Training", min: 300, max: 800 },
        { desc: "Annual maintenance", min: 1200, max: 3600 },
    ];
    const count = randomInt(2, 4);
    const used = new Set<number>();
    const lineItems: DevisLineItem[] = [];
    while (lineItems.length < count) {
        const i = randomInt(0, items.length - 1);
        if (used.has(i)) continue;
        used.add(i);
        const it = items[i];
        if (it === undefined) continue;
        const qty = randomInt(1, 3);
        const unitPrice = randomInt(it.min, it.max);
        lineItems.push({
            id: String(lineItems.length + 1),
            description: it.desc,
            quantity: qty,
            unitPrice,
            amount: qty * unitPrice,
        });
    }
    const today = new Date().toISOString().slice(0, 10);
    const validity = new Date();
    validity.setDate(validity.getDate() + 30);
    return {
        quoteNumber: `QT-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        quoteDate: today,
        validityDate: validity.toISOString().slice(0, 10),
        clientName: `${pick(firstNames)} ${pick(lastNames)}`,
        company: pick(companies),
        address: `${pick(streets)}, ${pick(cities)}`,
        signerEmail,
        lineItems,
        taxRatePercent: 20,
    };
}

export function DevisDemo() {
    const [data, setData] = useState<DevisFormData | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [envelopeUuid, setEnvelopeUuid] = useState<string | null>(null);
    const blobRef = useRef<Blob | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        getOwnerEmail().then((r) => {
            const email = "error" in r ? "" : r.email;
            setData(defaultFormData(email));
        });
    }, []);

    const generatePdf = useCallback(async (formData: DevisFormData) => {
        try {
            const doc = <DevisPdfDocument data={formData} />;
            const instance = pdf(doc);
            const blob = await instance.toBlob();
            blobRef.current = blob;
            const url = URL.createObjectURL(blob);
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return url;
            });
        } catch (e) {
            console.error("PDF generation failed", e);
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!data) return;
        debounceRef.current = setTimeout(() => {
            debounceRef.current = null;
            generatePdf(data);
        }, DEBOUNCE_MS);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [data, generatePdf]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const setField = useCallback(<K extends keyof DevisFormData>(key: K, value: DevisFormData[K]) => {
        setData((prev) => (prev ? { ...prev, [key]: value } : prev));
    }, []);

    const setLineItem = useCallback((index: number, updates: Partial<DevisLineItem>) => {
        setData((prev) => {
            if (!prev) return prev;
            const next = [...prev.lineItems];
            const current = next[index];
            if (current == null) return prev;
            const quantity = updates.quantity ?? current.quantity;
            const unitPrice = updates.unitPrice ?? current.unitPrice;
            const item: DevisLineItem = {
                id: updates.id ?? current.id,
                description: updates.description ?? current.description,
                quantity,
                unitPrice,
                amount: quantity * unitPrice,
            };
            next[index] = item;
            return { ...prev, lineItems: next };
        });
    }, []);

    const addLineItem = useCallback(() => {
        setData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                lineItems: [
                    ...prev.lineItems,
                    {
                        id: String(prev.lineItems.length + 1),
                        description: "",
                        quantity: 1,
                        unitPrice: 0,
                        amount: 0,
                    },
                ],
            };
        });
    }, []);

    const removeLineItem = useCallback((index: number) => {
        setData((prev) => {
            if (!prev || prev.lineItems.length <= 1) return prev;
            const next = prev.lineItems.filter((_, i) => i !== index);
            return { ...prev, lineItems: next };
        });
    }, []);

    const handleFillDummy = useCallback(() => {
        if (!data) return;
        setData(dummyFormData(data.signerEmail));
        setError(null);
    }, [data]);

    const handleSendForSignature = useCallback(async () => {
        if (!data) return;
        setError(null);
        setSending(true);
        try {
            let blob = blobRef.current;
            if (!blob) {
                const doc = <DevisPdfDocument data={data} />;
                const instance = pdf(doc);
                blob = await instance.toBlob();
            }
            const buffer = await blob.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            const title = `Quote – ${data.clientName || data.quoteNumber}`;
            const result = await createEnvelopeFromDevisPdf(base64, title);
            if ("error" in result) {
                setError(result.error);
                return;
            }
            saveEnvelope(result.envelopeUuid);
            setEnvelopeUuid(result.envelopeUuid);
            setIframeUrl(result.iframeUrl);
        } finally {
            setSending(false);
        }
    }, [data]);

    const handleBack = useCallback(() => {
        setIframeUrl(null);
        setEnvelopeUuid(null);
    }, []);

    if (data === null) {
        return (
            <div className="flex min-h-[200px] items-center justify-center p-8">
                <p className="text-sm text-[rgb(var(--color-text-muted))]">Loading form…</p>
            </div>
        );
    }

    if (iframeUrl && envelopeUuid) {
        return (
            <div className="flex h-[calc(100vh-7rem)] flex-col">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-2.5">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
                    >
                        ← Back to quote
                    </button>
                </div>
                <SigningIframe iframeUrl={iframeUrl} envelopeUuid={envelopeUuid} />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-7rem)] flex-col gap-4 p-4 lg:flex-row">
            <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-auto lg:max-w-md">
                <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-4 shadow-sm">
                    <h2 className="text-lg font-semibold tracking-tight text-[rgb(var(--color-text))]">Quote</h2>
                    <p className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
                        Fill in the form. The PDF preview updates in real time. Send for signature with Smart Anchor
                        positioning.
                    </p>
                    <button
                        type="button"
                        onClick={handleFillDummy}
                        className="btn-primary mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                    >
                        Fill with sample data
                    </button>
                </div>

                <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-4 shadow-sm">
                    <div className="grid gap-3">
                        <div>
                            <label
                                htmlFor="devis-quote-number"
                                className="block text-xs font-medium text-[rgb(var(--color-text-muted))]"
                            >
                                Quote no.
                            </label>
                            <input
                                id="devis-quote-number"
                                type="text"
                                value={data.quoteNumber}
                                onChange={(e) => setField("quoteNumber", e.target.value)}
                                className="mt-0.5 w-full rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-1.5 text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label
                                    htmlFor="devis-quote-date"
                                    className="block text-xs font-medium text-[rgb(var(--color-text-muted))]"
                                >
                                    Date
                                </label>
                                <input
                                    id="devis-quote-date"
                                    type="date"
                                    value={data.quoteDate}
                                    onChange={(e) => setField("quoteDate", e.target.value)}
                                    className="mt-0.5 w-full rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="devis-validity-date"
                                    className="block text-xs font-medium text-[rgb(var(--color-text-muted))]"
                                >
                                    Valid until
                                </label>
                                <input
                                    id="devis-validity-date"
                                    type="date"
                                    value={data.validityDate}
                                    onChange={(e) => setField("validityDate", e.target.value)}
                                    className="mt-0.5 w-full rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-1.5 text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label
                                htmlFor="devis-client-name"
                                className="block text-xs font-medium text-[rgb(var(--color-text-muted))]"
                            >
                                Client
                            </label>
                            <input
                                id="devis-client-name"
                                type="text"
                                value={data.clientName}
                                onChange={(e) => setField("clientName", e.target.value)}
                                placeholder="Client name"
                                className="mt-0.5 w-full rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-1.5 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="devis-company"
                                className="block text-xs font-medium text-[rgb(var(--color-text-muted))]"
                            >
                                Company
                            </label>
                            <input
                                id="devis-company"
                                type="text"
                                value={data.company}
                                onChange={(e) => setField("company", e.target.value)}
                                placeholder="Company name"
                                className="mt-0.5 w-full rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-1.5 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="devis-address"
                                className="block text-xs font-medium text-[rgb(var(--color-text-muted))]"
                            >
                                Address
                            </label>
                            <input
                                id="devis-address"
                                type="text"
                                value={data.address}
                                onChange={(e) => setField("address", e.target.value)}
                                placeholder="Street, city"
                                className="mt-0.5 w-full rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-1.5 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="devis-signer-email"
                                className="block text-xs font-medium text-[rgb(var(--color-text-muted))]"
                            >
                                Signer email
                            </label>
                            <input
                                id="devis-signer-email"
                                type="email"
                                value={data.signerEmail}
                                onChange={(e) => setField("signerEmail", e.target.value)}
                                placeholder="email@example.com"
                                className="mt-0.5 w-full rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-1.5 text-sm"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="devis-vat"
                                className="block text-xs font-medium text-[rgb(var(--color-text-muted))]"
                            >
                                VAT (%)
                            </label>
                            <input
                                id="devis-vat"
                                type="number"
                                min={0}
                                step={0.01}
                                value={data.taxRatePercent}
                                onChange={(e) => setField("taxRatePercent", parseFloat(e.target.value) || 0)}
                                placeholder="20"
                                className="mt-0.5 w-full rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-1.5 text-sm"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[rgb(var(--color-text))]">Line items</span>
                            <button
                                type="button"
                                onClick={addLineItem}
                                className="text-xs font-medium text-[rgb(var(--color-primary))] hover:underline"
                            >
                                + Add line
                            </button>
                        </div>
                        <div className="mt-2 space-y-2">
                            {data.lineItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="flex flex-wrap items-end gap-2 rounded border border-[rgb(var(--color-border))] p-2"
                                >
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => setLineItem(index, { description: e.target.value })}
                                        placeholder="Description"
                                        title="Line description"
                                        aria-label="Line description"
                                        className="min-w-0 flex-1 rounded border border-[rgb(var(--color-border))] px-2 py-1 text-sm"
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        value={item.quantity}
                                        onChange={(e) =>
                                            setLineItem(index, { quantity: parseInt(e.target.value, 10) || 0 })
                                        }
                                        title="Quantity"
                                        aria-label="Quantity"
                                        className="w-14 rounded border border-[rgb(var(--color-border))] px-2 py-1 text-right text-sm"
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={item.unitPrice}
                                        onChange={(e) =>
                                            setLineItem(index, { unitPrice: parseFloat(e.target.value) || 0 })
                                        }
                                        title="Unit price"
                                        aria-label="Unit price"
                                        className="w-20 rounded border border-[rgb(var(--color-border))] px-2 py-1 text-right text-sm"
                                    />
                                    <span className="w-16 text-right text-sm font-medium">
                                        {item.amount.toFixed(2)} €
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeLineItem(index)}
                                        disabled={data.lineItems.length <= 1}
                                        className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-40"
                                        aria-label="Remove line"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={handleSendForSignature}
                            disabled={sending}
                            className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
                        >
                            {sending ? (
                                <>
                                    <span
                                        className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                                        aria-hidden
                                    />
                                    Sending…
                                </>
                            ) : (
                                "Send for signature"
                            )}
                        </button>
                    </div>

                    {error && (
                        <div
                            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                <div className="mb-2 text-sm font-medium text-[rgb(var(--color-text-muted))]">PDF preview</div>
                <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-[rgb(var(--color-border))] bg-white shadow-sm">
                    {previewUrl ? (
                        <iframe src={previewUrl} title="Quote preview" className="h-full w-full border-0" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[rgb(var(--color-text-muted))]">
                            Generating preview…
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
