'use client';

import type { EnvelopeListItem } from './envelope-list.js';
import { EnvelopeList } from './envelope-list.js';

type CreateEnvelopeCardProps = {
  loading: boolean;
  onCreate: () => void;
  hasSavedEnvelopes: boolean;
  savedUnsigned: EnvelopeListItem[];
  loadingSaved: boolean;
  onOpenSaved: (uuid: string, signerEmail?: string) => void;
  openingUuid: string | null;
  error: string | null;
};

export function CreateEnvelopeCard({
  loading,
  onCreate,
  hasSavedEnvelopes,
  savedUnsigned,
  loadingSaved,
  onOpenSaved,
  openingUuid,
  error,
}: CreateEnvelopeCardProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-[rgb(var(--color-text))]">
          Create a signing session
        </h2>
        <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
          Generate an envelope and open the signing experience in one click.
        </p>
        <div className="mt-6 flex flex-col gap-4">
          <button
            type="button"
            onClick={onCreate}
            disabled={loading}
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium"
          >
            {loading ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden
                />
                Creating…
              </>
            ) : (
              'Create envelope and open signing'
            )}
          </button>
        </div>

        {hasSavedEnvelopes && (
          <div className="mt-6 border-t border-[rgb(var(--color-border))] pt-6">
            <h3 className="text-sm font-medium text-[rgb(var(--color-text))]">
              Unsigned envelopes
            </h3>
            <p className="mt-1 text-xs text-[rgb(var(--color-text-muted))]">
              Envelopes not signed yet. Open to continue signing.
            </p>
            <EnvelopeList
              items={savedUnsigned}
              loading={loadingSaved}
              onOpen={onOpenSaved}
              openingUuid={openingUuid}
            />
          </div>
        )}

        {error && (
          <div
            className="mt-4 rounded-lg border border-red-200 bg-[rgb(var(--color-error-bg))] px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
