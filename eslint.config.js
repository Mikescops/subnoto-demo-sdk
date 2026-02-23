import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default tseslint.config(
    { ignores: ["node_modules", "dist", "build", ".waku", "*.min.js", "pnpm-lock.yaml"] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        plugins: {
            react,
            "react-hooks": reactHooks,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly",
                fetch: "readonly",
                URL: "readonly",
                Blob: "readonly",
                FormData: "readonly",
                Buffer: "readonly",
                process: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                navigator: "readonly",
                localStorage: "readonly",
                JSON: "readonly",
                Array: "readonly",
                Object: "readonly",
                Promise: "readonly",
                Error: "readonly",
                Uint8Array: "readonly",
                TextEncoder: "readonly",
                Intl: "readonly",
                React: "readonly",
            },
        },
        settings: {
            react: { version: "detect" },
        },
        rules: {
            ...react.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",
        },
    },
    prettier
);
