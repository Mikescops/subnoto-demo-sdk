export const STORAGE_KEY = "subnoto_embedded_demo_envelopes";

export type SavedEnvelope = {
  envelopeUuid: string;
  createdAt: number;
  signerEmail?: string;
};

export function loadSavedEnvelopes(): SavedEnvelope[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is SavedEnvelope =>
        e != null &&
        typeof e === "object" &&
        typeof (e as SavedEnvelope).envelopeUuid === "string" &&
        typeof (e as SavedEnvelope).createdAt === "number",
    );
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
  list.push({ envelopeUuid, createdAt: Date.now(), signerEmail });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
