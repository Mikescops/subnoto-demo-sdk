import { SubnotoClient } from "@subnoto/api-client";
import { loadEnv } from "./env.js";

loadEnv();

export function getClientAndWorkspace():
    | {
          client: SubnotoClient;
          workspaceUuid: string;
          baseUrl: string;
      }
    | { error: string } {
    const apiBaseUrl = process.env.SUBNOTO_BASE_URL;
    const accessKey = process.env.SUBNOTO_ACCESS_KEY;
    const secretKey = process.env.SUBNOTO_SECRET_KEY;
    const workspaceUuid = process.env.WORKSPACE_UUID;
    if (!apiBaseUrl || !accessKey || !secretKey || !workspaceUuid) {
        return {
            error: "Missing env: SUBNOTO_BASE_URL, SUBNOTO_ACCESS_KEY, SUBNOTO_SECRET_KEY, WORKSPACE_UUID",
        };
    }
    const client = new SubnotoClient({
        apiBaseUrl,
        accessKey,
        secretKey,
        unattested: process.env.SUBNOTO_UNATTESTED === "true",
    });
    return { client, workspaceUuid, baseUrl: apiBaseUrl };
}
