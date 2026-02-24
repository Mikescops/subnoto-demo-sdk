# Subnoto SDK demo

A **multi-demo** app for the Subnoto SDK and iframe embedding: create envelopes, open the signing experience in an iframe, and run batch (mass) uploads.

## Demos

- **Create & Sign** (`/create-and-sign`) – Create one envelope from a sample PDF, add recipient and signature block, send with no email, open signing in an iframe. Reopen saved unsigned envelopes.
- **Mass upload** – Create many envelopes in one run (same PDF, random titles), then open any in the iframe.
- **Devis** – Build a quote PDF from a form (with live preview), send for signature using Smart Anchors (recipient and signature block are detected from the PDF). Open signing in an iframe.
- **Standalone iframe** – Reference for embedding the signing UI in a minimal HTML page.

## Quick start

**Requirements:** Node.js 18+, pnpm. See [docs/getting-started.md](docs/getting-started.md) for details.

1. **Env** – Copy `.env.example` to `.env` in the project root and set your Subnoto credentials:
    - `SUBNOTO_BASE_URL`, `SUBNOTO_ACCESS_KEY`, `SUBNOTO_SECRET_KEY`, `WORKSPACE_UUID`
    - Full list and optional vars: [docs/getting-started.md](docs/getting-started.md)

2. **Sample PDF** – Put `sample-multipage.pdf` in the `assets` folder.

3. **Run**
    - `pnpm install`
    - `pnpm run dev` → http://localhost:3000

## Docs

- [docs/README.md](docs/README.md) – Doc index
- [docs/getting-started.md](docs/getting-started.md) – Setup and run instructions
- [docs/customer-implementation.md](docs/customer-implementation.md) – Tutorial to implement the same logic on your side (API client, envelope creation, iframe token, status, mass creation)
- [docs/embed-library.md](docs/embed-library.md) – How to use the `@subnoto/embed-react` embed library and `SignEmbed` component
- [CONTRIBUTING.md](CONTRIBUTING.md) – How to contribute and what to check before pushing

## Scripts

- `pnpm run dev` – Dev server
- `pnpm run build` – Production build
- `pnpm run start` – Serve production build

The same mass-upload flow is available in the app at **/mass-upload**.
