import path from "node:path";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "waku/config";

const WASM_SOURCE = path.join(process.cwd(), "node_modules/@subnoto/api-client/oak_session_wasm_nodejs_bg.wasm");

/** Copies @subnoto/api-client WASM into the server build output so SSG can load it. */
function copySubnotoWasm() {
    return {
        name: "copy-subnoto-wasm",
        apply: "build" as const,
        writeBundle(outputOptions: { dir?: string | undefined }) {
            const dir = outputOptions.dir;
            if (!dir || !dir.includes("server")) return;
            const outDir =
                dir.endsWith(path.sep + "assets") || dir.endsWith("/assets") ? dir : path.join(dir, "assets");
            if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
            const dest = path.join(outDir, "oak_session_wasm_nodejs_bg.wasm");
            if (existsSync(WASM_SOURCE)) {
                copyFileSync(WASM_SOURCE, dest);
            }
        },
    };
}

export default defineConfig({
    vite: {
        plugins: [
            tailwindcss(),
            react({
                babel: {
                    plugins: ["babel-plugin-react-compiler"],
                },
            }),
            copySubnotoWasm(),
        ],
    },
});
