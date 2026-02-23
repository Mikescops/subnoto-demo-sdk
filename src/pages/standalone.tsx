export default async function StandalonePage() {
    return (
        <div className="min-h-[calc(100vh-7rem)] p-4 sm:p-6">
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-6 shadow-sm">
                    <h2 className="text-xl font-semibold tracking-tight text-[rgb(var(--color-text))]">
                        Standalone iframe
                    </h2>
                    <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                        This page demonstrates embedding the Subnoto signing experience in a minimal HTML page with no
                        app shell. The iframe is loaded with a token in the URL hash (
                        <code className="rounded bg-slate-100 px-1 text-xs">/embeds/sign#t=...</code>).
                    </p>
                    <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))]">
                        For a working example, create an envelope on the Create & Sign demo (
                        <code className="rounded bg-slate-100 px-1 text-xs">/create-and-sign</code>), then use the same
                        iframe URL in a static HTML file or another app.
                    </p>
                </div>
                <div className="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-4">
                    <p className="mb-3 text-xs font-medium text-[rgb(var(--color-text-muted))]">
                        Placeholder: open Create & Sign to get a live iframe URL
                    </p>
                    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-[rgb(var(--color-border))] bg-slate-50/50 text-sm text-[rgb(var(--color-text-muted))]">
                        Embed your signing iframe here (token in URL hash)
                    </div>
                </div>
            </div>
        </div>
    );
}

export const getConfig = async () => {
    return {
        render: "dynamic",
    } as const;
};
