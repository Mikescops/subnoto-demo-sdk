import "../styles.css";
import type { ReactNode } from "react";
import { getWhoami } from "../actions/whoami.js";
import { getWorkspaceSandboxStatus } from "../actions/workspace-sandbox.js";
import { WorkspaceSandboxEditor } from "../components/workspace-sandbox-editor.js";

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
    const whoami = await getWhoami();
    const sandboxStatus = await getWorkspaceSandboxStatus();

    return (
        <html lang="en">
            <head>
                <title>SignKit — e-signature demos</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body className="flex h-screen flex-col overflow-hidden bg-[rgb(var(--color-shell-bg))] antialiased">
                <header className="border-b border-[rgb(var(--color-shell-border))] bg-[rgb(var(--color-shell-header))]">
                    <div className="mx-auto max-w-6xl px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--color-primary))] font-semibold text-sm text-white">
                                S
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold tracking-tight text-[rgb(var(--color-shell-text))]">
                                    SignKit
                                </h1>
                                <p className="text-xs text-[rgb(var(--color-shell-text-muted))]">e-signature demos</p>
                            </div>
                        </div>
                        <nav className="-mx-4 mt-2 flex items-center gap-1 overflow-x-auto border-t border-[rgb(var(--color-shell-border))] px-4 pt-2 pb-1 [&>a]:whitespace-nowrap" aria-label="Demos">
                            {["/ → Home", "/create-and-sign → Create & Sign", "/mass-upload → Mass upload", "/standalone → Standalone iframe", "/devis → Devis", "/rent-contract → Rent contract"].map((entry) => {
                                const [href, label] = entry.split(" → ");
                                return (
                                    <a
                                        key={href}
                                        href={href}
                                        className="rounded-md px-2.5 py-1.5 text-sm font-medium text-[rgb(var(--color-shell-text-muted))] hover:bg-[rgb(var(--color-shell-link-hover))] hover:text-[rgb(var(--color-shell-text))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1 focus:ring-offset-[rgb(var(--color-shell-header))]"
                                    >
                                        {label}
                                    </a>
                                );
                            })}
                        </nav>
                    {"error" in whoami ? (
                        <div className="-mx-4 border-t border-[rgb(var(--color-shell-border))] px-4 py-1.5">
                            <p className="text-xs text-red-400">
                                Environment: {whoami.error}
                            </p>
                        </div>
                    ) : (
                        <div className="-mx-4 flex items-center gap-x-4 overflow-x-auto border-t border-[rgb(var(--color-shell-border))] px-4 py-1.5 text-xs text-[rgb(var(--color-shell-text-muted))] [&>span]:shrink-0 [&>span]:whitespace-nowrap">
                            <span title="API base URL">
                                <strong className="text-[rgb(var(--color-shell-text))]">API:</strong>{" "}
                                <code className="rounded bg-slate-100 px-1">{whoami.apiBaseUrl}</code>
                            </span>
                            <span title="Team name">
                                <strong className="text-[rgb(var(--color-shell-text))]">Team:</strong> {whoami.teamName}
                            </span>
                            <span title="Team UUID">
                                <strong className="text-[rgb(var(--color-shell-text))]">Team ID:</strong>{" "}
                                <code className="rounded bg-[rgb(var(--color-shell-link-hover))] px-1">{whoami.teamUuid}</code>
                            </span>
                            <span title="Owner email">
                                <strong className="text-[rgb(var(--color-shell-text))]">Owner:</strong> {whoami.ownerEmail}
                            </span>
                            <span title="API access key">
                                <strong className="text-[rgb(var(--color-shell-text))]">Key:</strong>{" "}
                                <code className="rounded bg-[rgb(var(--color-shell-link-hover))] px-1">{whoami.accessKey}</code>
                            </span>
                            {"error" in sandboxStatus ? (
                                <span title={sandboxStatus.error}>
                                    <strong className="text-[rgb(var(--color-shell-text))]">Sandbox:</strong>{" "}
                                    <span className="text-amber-400">{sandboxStatus.error}</span>
                                </span>
                            ) : (
                                <WorkspaceSandboxEditor
                                    sandbox={sandboxStatus.sandbox}
                                    workspaceUuid={sandboxStatus.workspaceUuid}
                                    workspaceName={sandboxStatus.workspaceName}
                                />
                            )}
                        </div>
                    )}
                    </div>
                </header>
                <main className="min-h-0 flex-1 overflow-auto">{children}</main>
            </body>
        </html>
    );
}

export const getConfig = async () => {
    return {
        render: "dynamic",
    } as const;
};
