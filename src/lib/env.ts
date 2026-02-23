import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..", "..");

/** Load .env from project root so Waku/Vite server context uses the correct env. */
export function loadEnv(): void {
    config({ path: join(projectRoot, ".env"), override: true, quiet: true });
}

/** Project root directory (for resolving sample PDF etc.). */
export function getProjectRoot(): string {
    return projectRoot;
}
