export const STORAGE_KEY = "subnoto_embedded_demo_envelopes";

export type SavedEnvelope = {
    envelopeUuid: string;
    createdAt: number;
    signerEmail?: string;
};

function isSavedEnvelope(e: unknown): e is SavedEnvelope {
    if (e == null || typeof e !== "object") return false;
    const o = e as Record<string, unknown>;
    return (
        typeof o.envelopeUuid === "string" &&
        typeof o.createdAt === "number" &&
        (o.signerEmail === undefined || typeof o.signerEmail === "string")
    );
}

export function loadSavedEnvelopes(): SavedEnvelope[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(isSavedEnvelope);
    } catch {
        return [];
    }
}

export function saveEnvelope(envelopeUuid: string, signerEmail?: string): void {
    const list = loadSavedEnvelopes();
    const existing = list.find((e) => e.envelopeUuid === envelopeUuid);
    if (existing) {
        if (signerEmail !== undefined) {
            existing.signerEmail = signerEmail;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
        return;
    }
    const entry: SavedEnvelope = { envelopeUuid, createdAt: Date.now() };
    if (signerEmail !== undefined) entry.signerEmail = signerEmail;
    list.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
