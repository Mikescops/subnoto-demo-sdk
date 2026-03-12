import { SubnotoClient } from "@subnoto/api-client";
import { loadEnv } from "./env.js";

loadEnv();

export function getClientAndWorkspace():
    | {
          client: SubnotoClient;
          workspaceUuid?: string;
      }
    | { error: string } {
    const apiBaseUrl = process.env.SUBNOTO_BASE_URL;
    const accessKey = process.env.SUBNOTO_ACCESS_KEY;
    const secretKey = process.env.SUBNOTO_SECRET_KEY;
    const workspaceUuid = process.env.WORKSPACE_UUID;
    if (!accessKey || !secretKey) {
        return {
            error: "Missing env: SUBNOTO_ACCESS_KEY, SUBNOTO_SECRET_KEY",
        };
    }
    const client = new SubnotoClient({
        ...(apiBaseUrl && { apiBaseUrl }),
        accessKey,
        secretKey,
        unattested: process.env.SUBNOTO_UNATTESTED === "true",
    });
    return { client, ...(workspaceUuid && { workspaceUuid }) };
}
