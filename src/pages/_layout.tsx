import '../styles.css';
import type { ReactNode } from 'react';
import { getWhoami } from '../actions/whoami.js';

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
  const whoami = await getWhoami();

  return (
    <html lang="en">
      <head>
        <title>Subnoto SDK & iframe demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen antialiased">
        <header className="border-b bg-[rgb(var(--color-surface-elevated))] px-4 py-3 shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--color-primary))] text-white font-semibold text-sm">
                S
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-[rgb(var(--color-text))]">
                  Subnoto
                </h1>
                <p className="text-xs text-[rgb(var(--color-text-muted))]">
                  SDK & iframe demo
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-1 sm:gap-3" aria-label="Demos">
              <a
                href="/"
                className="rounded-md px-2 py-1.5 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:bg-slate-100 hover:text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1"
              >
                Home
              </a>
              <a
                href="/create-and-sign"
                className="rounded-md px-2 py-1.5 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:bg-slate-100 hover:text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1"
              >
                Create & Sign
              </a>
              <a
                href="/mass-upload"
                className="rounded-md px-2 py-1.5 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:bg-slate-100 hover:text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1"
              >
                Mass upload
              </a>
              <a
                href="/standalone"
                className="rounded-md px-2 py-1.5 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:bg-slate-100 hover:text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1"
              >
                Standalone iframe
              </a>
              <a
                href="/devis"
                className="rounded-md px-2 py-1.5 text-sm font-medium text-[rgb(var(--color-text-muted))] hover:bg-slate-100 hover:text-[rgb(var(--color-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1"
              >
                Devis
              </a>
            </nav>
          </div>
          {'error' in whoami ? (
            <div className="mt-2 border-t border-[rgb(var(--color-border))] pt-2">
              <p className="text-xs text-[rgb(var(--color-text-muted))]">
                Environment: <span className="text-red-600">{whoami.error}</span>
              </p>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[rgb(var(--color-border))] pt-2 text-xs text-[rgb(var(--color-text-muted))]">
              <span title="API base URL">
                <strong className="text-[rgb(var(--color-text))]">API:</strong>{' '}
                <code className="rounded bg-slate-100 px-1">{whoami.apiBaseUrl}</code>
              </span>
              <span title="Team name">
                <strong className="text-[rgb(var(--color-text))]">Team:</strong>{' '}
                {whoami.teamName}
              </span>
              <span title="Team UUID">
                <strong className="text-[rgb(var(--color-text))]">Team ID:</strong>{' '}
                <code className="rounded bg-slate-100 px-1">{whoami.teamUuid}</code>
              </span>
              <span title="Owner email">
                <strong className="text-[rgb(var(--color-text))]">Owner:</strong>{' '}
                {whoami.ownerEmail}
              </span>
              <span title="API access key">
                <strong className="text-[rgb(var(--color-text))]">Key:</strong>{' '}
                <code className="rounded bg-slate-100 px-1">{whoami.accessKey}</code>
              </span>
            </div>
          )}
        </header>
        <main className="min-h-[calc(100vh-7rem)]">{children}</main>
      </body>
    </html>
  );
}

export const getConfig = async () => {
  return {
    render: 'dynamic',
  } as const;
};
