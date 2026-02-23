'use client';

import { truncateUuid } from '../lib/uuid.js';

type SigningIframeProps = {
  iframeUrl: string;
  envelopeUuid?: string | null;
  onCopy?: (text: string) => void;
  copied?: boolean;
};

export function SigningIframe({
  iframeUrl,
  envelopeUuid,
  onCopy,
  copied = false,
}: SigningIframeProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {envelopeUuid && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] px-4 py-2.5 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[rgb(var(--color-primary))] text-xs font-semibold text-white">
              S
            </div>
            <span className="text-sm font-medium text-[rgb(var(--color-text-muted))]">
              Subnoto
            </span>
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
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
        </div>
      )}
      <iframe
        src={iframeUrl}
        title="Subnoto signing"
        className="min-h-0 w-full flex-1 border-0"
        allow="fullscreen"
        allowFullScreen
      />
    </div>
  );
}
