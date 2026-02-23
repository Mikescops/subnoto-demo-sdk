export default async function HomePage() {
    const tools = [
        {
            href: "/create-and-sign",
            title: "Create & Sign",
            description:
                "Create one envelope from a sample PDF, add recipient and signature block, send with no email, and open the signing experience in an iframe. Reopen saved unsigned envelopes.",
            icon: "✉️",
        },
        {
            href: "/mass-upload",
            title: "Mass upload",
            description: "Create many envelopes in one run (same PDF, random titles), then open any in the iframe.",
            icon: "📦",
        },
        {
            href: "/devis",
            title: "Devis",
            description:
                "Build a quote PDF from a form with live preview. Send for signature using Smart Anchors—recipient and signature block are detected from the PDF.",
            icon: "📄",
        },
        {
            href: "/standalone",
            title: "Standalone iframe",
            description:
                "Reference for embedding the signing UI in a minimal HTML page. Token in URL hash, no app shell.",
            icon: "🔗",
        },
    ];

    return (
        <div className="min-h-[calc(100vh-7rem)] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-5xl">
                <header className="mb-10">
                    <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--color-text))] sm:text-3xl">
                        Subnoto SDK & iframe demo
                    </h1>
                    <p className="mt-2 text-sm text-[rgb(var(--color-text-muted))] sm:text-base">
                        Create envelopes, embed the signing experience, and run batch uploads. Pick a tool below to get
                        started.
                    </p>
                </header>

                <ul className="grid gap-5 sm:grid-cols-2">
                    {tools.map((tool) => (
                        <li key={tool.href}>
                            <a
                                href={tool.href}
                                className="group flex h-full flex-col rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] p-5 shadow-sm transition hover:border-[rgb(var(--color-primary))] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-2"
                            >
                                <span
                                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(var(--color-surface))] text-xl"
                                    aria-hidden
                                >
                                    {tool.icon}
                                </span>
                                <h2 className="text-lg font-semibold tracking-tight text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))]">
                                    {tool.title}
                                </h2>
                                <p className="mt-1 flex-1 text-sm text-[rgb(var(--color-text-muted))]">
                                    {tool.description}
                                </p>
                                <span className="mt-4 inline-flex items-center text-sm font-medium text-[rgb(var(--color-primary))]">
                                    Open →
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export const getConfig = async () => {
    return {
        render: "dynamic",
    } as const;
};
