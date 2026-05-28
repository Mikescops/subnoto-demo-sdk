"use client";

import { useState, useTransition } from "react";
import { setWorkspaceSandbox } from "../actions/workspace-sandbox.js";

type Props = {
    sandbox: boolean;
    workspaceUuid: string;
    workspaceName: string;
};

export function WorkspaceSandboxEditor({ sandbox: initialSandbox, workspaceUuid, workspaceName }: Props) {
    const [sandbox, setSandbox] = useState(initialSandbox);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function toggle() {
        setError(null);
        startTransition(async () => {
            const result = await setWorkspaceSandbox(!sandbox);
            if ("error" in result) {
                setError(result.error);
            } else {
                setSandbox(result.sandbox);
            }
        });
    }

    return (
        <span className="flex items-center gap-2" title={`Workspace: ${workspaceName} (${workspaceUuid})`}>
            <strong className="text-[rgb(var(--color-text))]">Sandbox:</strong>
            <button
                onClick={toggle}
                disabled={isPending}
                aria-pressed={sandbox}
                className={[
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold transition",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:ring-offset-1",
                    "disabled:opacity-60 cursor-pointer",
                    sandbox
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                ].join(" ")}
            >
                <span
                    className={[
                        "h-1.5 w-1.5 rounded-full",
                        sandbox ? "bg-emerald-500" : "bg-slate-400",
                    ].join(" ")}
                    aria-hidden
                />
                {isPending ? "…" : sandbox ? "ON" : "OFF"}
            </button>
            {error && <span className="text-red-600 text-xs">{error}</span>}
        </span>
    );
}
