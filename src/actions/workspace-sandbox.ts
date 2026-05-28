"use server";

import { getErrorMessage } from "@subnoto/api-client";
import { getClientAndWorkspace } from "../lib/subnoto-client.js";

export type WorkspaceSandboxResult =
    | { sandbox: boolean; workspaceUuid: string; workspaceName: string }
    | { error: string };

export async function getWorkspaceSandboxStatus(): Promise<WorkspaceSandboxResult> {
    const ctx = getClientAndWorkspace();
    if ("error" in ctx) return { error: ctx.error };
    const { client, workspaceUuid } = ctx;
    if (!workspaceUuid) return { error: "WORKSPACE_UUID is not set" };

    const { data, error } = await client.POST("/public/workspace/get", {
        body: { workspaceUuid },
    });
    if (error || !data) {
        return { error: getErrorMessage(error) ?? "Failed to get workspace" };
    }
    return {
        sandbox: data.workspace.sandbox,
        workspaceUuid: data.workspace.uuid,
        workspaceName: data.workspace.name,
    };
}

export async function setWorkspaceSandbox(sandbox: boolean): Promise<WorkspaceSandboxResult> {
    const ctx = getClientAndWorkspace();
    if ("error" in ctx) return { error: ctx.error };
    const { client, workspaceUuid } = ctx;
    if (!workspaceUuid) return { error: "WORKSPACE_UUID is not set" };

    const { data, error } = await client.POST("/public/workspace/update", {
        body: { workspaceUuid, sandbox },
    });
    if (error || !data) {
        return { error: getErrorMessage(error) ?? "Failed to update workspace" };
    }
    return {
        sandbox: data.workspace.sandbox,
        workspaceUuid: data.workspace.uuid,
        workspaceName: data.workspace.name,
    };
}
