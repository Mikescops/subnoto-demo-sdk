"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { SignEmbed } from "@subnoto/embed-react";
import { createRentContractEnvelope } from "../actions/create-rent-contract-envelope.js";
import { getWhoami } from "../actions/whoami.js";
import { saveEnvelope } from "../lib/storage-envelopes.js";
import { RentContractPdfDocument, type RentContractData } from "./rent-contract-pdf-document.js";
import type { DocumentSignedPayload } from "./signing-iframe.js";

const DEBOUNCE_MS = 500;

const SAMPLE_LANDLORDS = ["Marie Dupont", "Jean-Pierre Martin", "Sophie Leclerc", "François Bernard"];
const SAMPLE_ADDRESSES = [
    "12 rue de Rivoli, 75001 Paris",
    "5 avenue des Champs-Élysées, 75008 Paris",
    "34 boulevard Haussmann, 75009 Paris",
    "8 rue du Commerce, 75015 Paris",
];
const SAMPLE_TENANTS = ["Camille Rousseau", "Lucas Moreau", "Emma Petit", "Nathan Dubois"];
const PROPERTY_TYPES = ["Furnished apartment", "Unfurnished apartment", "Studio", "Loft"];

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)] as T;
}

function defaultData(tenantEmail = ""): RentContractData {
    const start = new Date();
    start.setDate(1);
    start.setMonth(start.getMonth() + 1);
    return {
        landlordName: "",
        landlordAddress: "",
        tenantName: "",
        tenantEmail,
        propertyAddress: "",
        propertyType: "Furnished apartment",
        surface: "",
        startDate: start.toISOString().slice(0, 10),
        monthlyRent: "",
        deposit: "",
    };
}

function sampleData(tenantEmail: string): RentContractData {
    const start = new Date();
    start.setDate(1);
    start.setMonth(start.getMonth() + 1);
    const rent = String(700 + Math.floor(Math.random() * 1300));
    return {
        landlordName: pick(SAMPLE_LANDLORDS),
        landlordAddress: pick(SAMPLE_ADDRESSES),
        tenantName: pick(SAMPLE_TENANTS),
        tenantEmail,
        propertyAddress: pick(SAMPLE_ADDRESSES),
        propertyType: pick(PROPERTY_TYPES),
        surface: String(20 + Math.floor(Math.random() * 80)),
        startDate: start.toISOString().slice(0, 10),
        monthlyRent: rent,
        deposit: String(Number(rent) * 2),
    };
}

// Inner content-box dimensions for the phone chrome (CSS px).
// The visible outer size will be frameW + 2×BORDER by frameH + 2×BORDER.
const DEVICE_PRESETS = [
    { label: "iPhone 14", frameW: 300, frameH: 620 },
    { label: "iPhone SE", frameW: 270, frameH: 540 },
    { label: "Pixel 7",   frameW: 300, frameH: 640 },
    { label: "Galaxy S23", frameW: 280, frameH: 590 },
] as const;

type DevicePreset = (typeof DEVICE_PRESETS)[number];

export function RentContractDemo() {
    const [data, setData] = useState<RentContractData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [iframeToken, setIframeToken] = useState<string | null>(null);
    const [embedHost, setEmbedHost] = useState<string | null>(null);
    const [envelopeUuid, setEnvelopeUuid] = useState<string | null>(null);
    const [signedMessage, setSignedMessage] = useState<string | null>(null);
    const [device, setDevice] = useState<DevicePreset>(DEVICE_PRESETS[0]);
    const blobRef = useRef<Blob | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        getWhoami().then((r) => {
            const email = "error" in r ? "" : r.ownerEmail;
            setData(defaultData(email));
        });
    }, []);

    // Regenerate PDF on data change (debounced) — only needed after send for preview, kept as ref
    useEffect(() => {
        if (!data) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const blob = await pdf(<RentContractPdfDocument data={data} />).toBlob();
                blobRef.current = blob;
            } catch {
                // ignore preview errors
            }
        }, DEBOUNCE_MS);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [data]);

    const setField = useCallback(<K extends keyof RentContractData>(key: K, value: RentContractData[K]) => {
        setData((prev) => (prev ? { ...prev, [key]: value } : prev));
    }, []);

    const handleFillSample = useCallback(() => {
        if (!data) return;
        setData(sampleData(data.tenantEmail));
        setError(null);
    }, [data]);

    const handleSend = useCallback(async () => {
        if (!data) return;
        if (!data.tenantEmail) {
            setError("Tenant email is required.");
            return;
        }
        setError(null);
        setSending(true);
        try {
            let blob = blobRef.current;
            if (!blob) {
                blob = await pdf(<RentContractPdfDocument data={data} />).toBlob();
            }
            const buffer = await blob.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

            const result = await createRentContractEnvelope(base64, data.tenantEmail, data.tenantName);
            if ("error" in result) {
                setError(result.error);
                return;
            }
            saveEnvelope(result.envelopeUuid);
            setEnvelopeUuid(result.envelopeUuid);
            setIframeToken(result.iframeToken);
            setEmbedHost(result.host);
        } finally {
            setSending(false);
        }
    }, [data]);

    const handleBack = useCallback(() => {
        setIframeToken(null);
        setEmbedHost(null);
        setEnvelopeUuid(null);
        setSignedMessage(null);
    }, []);

    const handleDocumentSigned = useCallback((payload: { envelopeUuid: string; completed: boolean }) => {
        setSignedMessage(
            payload.completed
                ? "Contract signed. All parties have completed the envelope."
                : "Signature recorded. Waiting for other signers."
        );
    }, []);

    if (!data) {
        return (
            <div className="flex min-h-[200px] items-center justify-center">
                <p className="text-sm text-[rgb(var(--color-text-muted))]">Loading…</p>
            </div>
        );
    }

    // Signing view: form side hidden, phone frame shows signing iframe
    if (iframeToken && envelopeUuid) {
        return (
            <div className="flex h-full flex-col">
                <div className="flex shrink-0 items-center gap-3 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-2.5">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="text-sm font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))]"
                    >
                        ← Back to form
                    </button>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-[rgb(var(--color-text-muted))]">Device:</span>
                        {DEVICE_PRESETS.map((d) => (
                            <button
                                key={d.label}
                                type="button"
                                onClick={() => setDevice(d)}
                                className={[
                                    "rounded px-2 py-0.5 text-xs font-medium transition",
                                    device.label === d.label
                                        ? "bg-[rgb(var(--color-primary))] text-white"
                                        : "bg-slate-100 text-[rgb(var(--color-text-muted))] hover:bg-slate-200",
                                ].join(" ")}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                {signedMessage && (
                    <div
                        role="alert"
                        className="flex shrink-0 items-center justify-between gap-3 border-b border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800"
                    >
                        <span>{signedMessage}</span>
                        <button
                            type="button"
                            onClick={() => setSignedMessage(null)}
                            className="shrink-0 rounded px-2 py-1 text-green-700 hover:bg-green-100"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Centred phone mockup */}
                <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-100 py-8">
                    <PhoneFrame
                        device={device}
                        iframeToken={iframeToken}
                        embedHost={embedHost ?? undefined}
                        onDocumentSigned={handleDocumentSigned}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col gap-4 p-4 lg:flex-row">
            {/* Left: form */}
            <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-auto lg:max-w-md">
                <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-4 shadow-sm">
                    <h2 className="text-lg font-semibold tracking-tight text-[rgb(var(--color-text))]">
                        Rental Agreement
                    </h2>
                    <p className="mt-1 text-sm text-[rgb(var(--color-text-muted))]">
                        Fill in the contract details. After sending, you can preview the signing experience in a mobile
                        phone frame.
                    </p>
                    <button
                        type="button"
                        onClick={handleFillSample}
                        className="btn-primary mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                    >
                        Fill with sample data
                    </button>
                </div>

                <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-4 shadow-sm">
                    <div className="grid gap-3">
                        <fieldset>
                            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--color-text-muted))]">
                                Landlord
                            </legend>
                            <div className="grid gap-2">
                                <Field
                                    id="rc-landlord-name"
                                    label="Full name"
                                    value={data.landlordName}
                                    onChange={(v) => setField("landlordName", v)}
                                    placeholder="Marie Dupont"
                                />
                                <Field
                                    id="rc-landlord-address"
                                    label="Address"
                                    value={data.landlordAddress}
                                    onChange={(v) => setField("landlordAddress", v)}
                                    placeholder="12 rue de Rivoli, Paris"
                                />
                            </div>
                        </fieldset>

                        <div className="border-t border-[rgb(var(--color-border))] pt-3">
                            <fieldset>
                                <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--color-text-muted))]">
                                    Tenant
                                </legend>
                                <div className="grid gap-2">
                                    <Field
                                        id="rc-tenant-name"
                                        label="Full name"
                                        value={data.tenantName}
                                        onChange={(v) => setField("tenantName", v)}
                                        placeholder="Lucas Moreau"
                                    />
                                    <Field
                                        id="rc-tenant-email"
                                        label="Email"
                                        type="email"
                                        value={data.tenantEmail}
                                        onChange={(v) => setField("tenantEmail", v)}
                                        placeholder="tenant@example.com"
                                        required
                                    />
                                </div>
                            </fieldset>
                        </div>

                        <div className="border-t border-[rgb(var(--color-border))] pt-3">
                            <fieldset>
                                <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--color-text-muted))]">
                                    Property
                                </legend>
                                <div className="grid gap-2">
                                    <Field
                                        id="rc-property-address"
                                        label="Address"
                                        value={data.propertyAddress}
                                        onChange={(v) => setField("propertyAddress", v)}
                                        placeholder="5 avenue des Champs-Élysées, Paris"
                                    />
                                    <div>
                                        <label
                                            htmlFor="rc-property-type"
                                            className="block text-xs font-medium text-[rgb(var(--color-text-muted))]"
                                        >
                                            Type
                                        </label>
                                        <select
                                            id="rc-property-type"
                                            value={data.propertyType}
                                            onChange={(e) => setField("propertyType", e.target.value)}
                                            className="mt-0.5 w-full rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-1.5 text-sm"
                                        >
                                            {PROPERTY_TYPES.map((t) => (
                                                <option key={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Field
                                        id="rc-surface"
                                        label="Surface (m²)"
                                        type="number"
                                        value={data.surface}
                                        onChange={(v) => setField("surface", v)}
                                        placeholder="45"
                                    />
                                </div>
                            </fieldset>
                        </div>

                        <div className="border-t border-[rgb(var(--color-border))] pt-3">
                            <fieldset>
                                <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--color-text-muted))]">
                                    Financial terms
                                </legend>
                                <div className="grid gap-2">
                                    <Field
                                        id="rc-start-date"
                                        label="Lease start"
                                        type="date"
                                        value={data.startDate}
                                        onChange={(v) => setField("startDate", v)}
                                    />
                                    <Field
                                        id="rc-rent"
                                        label="Monthly rent (€)"
                                        type="number"
                                        value={data.monthlyRent}
                                        onChange={(v) => setField("monthlyRent", v)}
                                        placeholder="900"
                                    />
                                    <Field
                                        id="rc-deposit"
                                        label="Deposit (€)"
                                        type="number"
                                        value={data.deposit}
                                        onChange={(v) => setField("deposit", v)}
                                        placeholder="1800"
                                    />
                                </div>
                            </fieldset>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={handleSend}
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
                                "Send for signature →"
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

            {/* Right: static phone mockup preview hint */}
            <div className="flex min-h-0 flex-1 items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center">
                    <PhoneFrame device={DEVICE_PRESETS[0]} />
                    <p className="text-xs text-[rgb(var(--color-text-muted))]">
                        {DEVICE_PRESETS[0].label}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

type FieldProps = {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
};

function Field({ id, label, value, onChange, placeholder, type = "text", required }: FieldProps) {
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-medium text-[rgb(var(--color-text-muted))]">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="mt-0.5 w-full rounded-md border border-[rgb(var(--color-border))] bg-white px-3 py-1.5 text-sm"
            />
        </div>
    );
}

// All in CSS px, relative to the inner content area (inside the border)
const BORDER = 10;
const BEZEL_X = 10;
const BEZEL_TOP = 44;
const BEZEL_BOTTOM = 28;

const DEFAULT_EMBED_ORIGIN = "https://app.subnoto.com";

type PhoneFrameProps = {
    device: DevicePreset;
    iframeToken?: string;
    embedHost?: string;
    onDocumentSigned?: (payload: DocumentSignedPayload) => void;
};

// The virtual viewport width we tell the iframe to render at.
// Must match a real mobile breakpoint so the signing app uses its mobile layout.
const VIRTUAL_VIEWPORT_W = 390;

// Heights of the fixed chrome bars inside the screen (CSS px)
const CHROME_STATUS_H = 20;
const CHROME_HEADER_H = 44;
const CHROME_BREADCRUMB_H = 26;
const CHROME_BOTTOM_NAV_H = 40;
const CHROME_TOTAL_H = CHROME_STATUS_H + CHROME_HEADER_H + CHROME_BREADCRUMB_H + CHROME_BOTTOM_NAV_H;

function PhoneFrame({ device, iframeToken, embedHost, onDocumentSigned }: PhoneFrameProps) {
    // frameW/frameH are the content-box size (inside the border).
    const screenW = device.frameW - BEZEL_X * 2;
    const screenH = device.frameH - BEZEL_TOP - BEZEL_BOTTOM;

    // Scale factor: shrink the 390px virtual viewport down to screenW.
    const scale = screenW / VIRTUAL_VIEWPORT_W;

    useEffect(() => {
        if (!iframeToken || !onDocumentSigned) return;
        const expectedOrigin = (embedHost ?? DEFAULT_EMBED_ORIGIN).replace(/\/$/, "").toLowerCase();
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

        function handleMessage(event: MessageEvent) {
            if (event.data?.type !== "subnoto:documentSigned") return;
            const originNorm = event.origin.toLowerCase();
            if (originNorm !== expectedOrigin && !isLocal) return;
            const p = event.data.payload;
            if (p && typeof p.envelopeUuid === "string" && typeof p.completed === "boolean") {
                onDocumentSigned?.({ envelopeUuid: p.envelopeUuid, completed: p.completed });
            }
        }

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [iframeToken, embedHost, onDocumentSigned]);

    return (
        <div
            className="relative shrink-0 rounded-[36px] bg-slate-800 shadow-2xl ring-1 ring-slate-700"
            style={{
                // Use content-box so width/height describe the inner area; border adds on top.
                boxSizing: "content-box",
                width: device.frameW,
                height: device.frameH,
                borderWidth: BORDER,
                borderStyle: "solid",
                borderColor: "rgb(30 41 59)", // slate-800
            }}
        >
            {/* Notch */}
            <div
                className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-xl bg-slate-800"
                style={{ width: 90, height: 20 }}
                aria-hidden
            />
            {/* Screen — flex column so children fill exactly without magic numbers */}
            <div
                className="absolute flex flex-col overflow-hidden bg-[#f5f6fa]"
                style={{ top: BEZEL_TOP, left: BEZEL_X, width: screenW, height: screenH, borderRadius: 6 }}
            >
                {/* Fake status bar */}
                <div
                    className="flex shrink-0 items-center justify-between bg-[#1a1f36] px-3"
                    style={{ height: 20 }}
                >
                    <span className="text-[9px] font-semibold text-white/80">9:41</span>
                    <div className="flex items-center gap-1">
                        {/* Signal dots */}
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
                            <rect x="0" y="5" width="2" height="3" rx="0.5" fill="white" fillOpacity="0.5"/>
                            <rect x="3" y="3" width="2" height="5" rx="0.5" fill="white" fillOpacity="0.7"/>
                            <rect x="6" y="1" width="2" height="7" rx="0.5" fill="white"/>
                            <rect x="9" y="0" width="2" height="8" rx="0.5" fill="white"/>
                        </svg>
                        {/* Battery */}
                        <svg width="16" height="8" viewBox="0 0 16 8" aria-hidden>
                            <rect x="0.5" y="0.5" width="13" height="7" rx="1.5" stroke="white" strokeOpacity="0.6"/>
                            <rect x="1.5" y="1.5" width="9" height="5" rx="1" fill="white"/>
                            <path d="M14.5 2.5v3" stroke="white" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </div>
                </div>

                {/* App header — height must match CHROME_HEADER_H */}
                <div
                    className="flex shrink-0 items-center gap-2 bg-[#1a1f36] px-3"
                    style={{ height: CHROME_HEADER_H }}
                >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-500 text-white" style={{ fontSize: 11, fontWeight: 700 }}>
                        H
                    </div>
                    <span className="text-xs font-semibold text-white">HomeRent</span>
                    <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                            <circle cx="5" cy="5" r="4" stroke="white" strokeOpacity="0.7"/>
                            <path d="M5 3v2.5l1.5 1" stroke="white" strokeOpacity="0.7" strokeWidth="1" strokeLinecap="round"/>
                        </svg>
                    </div>
                </div>

                {/* Breadcrumb — height must match CHROME_BREADCRUMB_H */}
                <div className="flex shrink-0 items-center gap-1.5 bg-white px-3 shadow-sm" style={{ height: CHROME_BREADCRUMB_H }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                        <path d="M6 2L3 5l3 3" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[9px] text-gray-400">My rentals</span>
                    <span className="text-[9px] text-gray-300">/</span>
                    <span className="text-[9px] font-medium text-gray-600">Sign contract</span>
                </div>

                {iframeToken ? (
                    <IframeSlot
                        iframeToken={iframeToken}
                        embedHost={embedHost}
                        screenW={screenW}
                        slotH={screenH - CHROME_TOTAL_H}
                        scale={scale}
                    />
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 py-8">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-3xl shadow-sm">
                            🏠
                        </div>
                        <p className="text-[11px] font-semibold text-gray-700">Sign your rental contract</p>
                        <p className="text-[10px] text-center text-gray-400">
                            Fill in the form and send to preview the signing experience here.
                        </p>
                    </div>
                )}

                {/* Bottom nav */}
                <div
                    className="flex shrink-0 items-center justify-around border-t border-gray-100 bg-white"
                    style={{ height: 40 }}
                >
                    {[
                        { icon: "🏠", label: "Home" },
                        { icon: "📄", label: "Docs", active: true },
                        { icon: "🔔", label: "Alerts" },
                        { icon: "👤", label: "Profile" },
                    ].map((tab) => (
                        <div key={tab.label} className="flex flex-col items-center gap-0.5">
                            <span style={{ fontSize: 13 }}>{tab.icon}</span>
                            <span
                                className={["text-[8px] font-medium", tab.active ? "text-indigo-600" : "text-gray-400"].join(" ")}
                            >
                                {tab.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            {/* Home indicator */}
            <div
                className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-slate-500"
                style={{ width: 80, height: 3 }}
                aria-hidden
            />
        </div>
    );
}

type IframeSlotProps = {
    iframeToken: string;
    embedHost?: string;
    screenW: number;
    slotH: number;
    scale: number;
};

function IframeSlot({ iframeToken, embedHost, screenW, slotH, scale }: IframeSlotProps) {
    // Iframe renders at VIRTUAL_VIEWPORT_W × (slotH/scale) then is scaled down
    // so the visible output is exactly screenW × slotH CSS px.
    const iframeH = Math.ceil(slotH / scale);

    return (
        <div style={{ width: screenW, height: slotH, overflow: "hidden", flexShrink: 0 }}>
            <div
                style={{
                    width: VIRTUAL_VIEWPORT_W,
                    height: iframeH,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                }}
            >
                <SignEmbed
                    token={iframeToken}
                    {...(embedHost ? { host: embedHost } : {})}
                    title="Subnoto signing"
                    className="h-full w-full border-0 block"
                />
            </div>
        </div>
    );
}
