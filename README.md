# Subnoto SDK demo

This app shows how to use the Subnoto SDK and embed the signing flow in your own product. You can create envelopes, open the signing experience in an iframe, and run batch uploads.

## Demos

- **Create & Sign** (`/create-and-sign`): Create one envelope from a sample PDF, add a recipient and signature block, send without email, and open signing in an iframe. You can also reopen saved unsigned envelopes from the list.
- **Mass upload**: Create multiple envelopes in one run (same PDF, random titles), then open any of them in the iframe.
- **Devis**: Build a quote PDF from a form with a live preview, then send it for signature using Smart Anchors so the recipient and signature block are detected from the PDF. Signing opens in an iframe.
- **Standalone iframe**: Minimal example for embedding the signing UI in a plain HTML page.

## Quick start

**Requirements:** Node.js 18+ and pnpm. Details are in [docs/getting-started.md](docs/getting-started.md).

1. **Environment**: Copy `.env.example` to `.env` in the project root and set your Subnoto credentials:
    - `SUBNOTO_BASE_URL`, `SUBNOTO_ACCESS_KEY`, `SUBNOTO_SECRET_KEY`, `WORKSPACE_UUID`
    - Full list and optional variables: [docs/getting-started.md](docs/getting-started.md)

2. **Sample PDF**: Place `sample-multipage.pdf` in the `assets` folder.

3. **Run**:
    - `pnpm install`
    - `pnpm run dev` then open http://localhost:3000

## Docs

- [docs/README.md](docs/README.md): Doc index
- [docs/getting-started.md](docs/getting-started.md): Setup and run instructions
- [docs/customer-implementation.md](docs/customer-implementation.md): Tutorial to implement the same flow on your side (API client, envelope creation, iframe token, status, mass creation)
- [docs/embed-library.md](docs/embed-library.md): Using the `@subnoto/embed-react` library and the `SignEmbed` component
- [CONTRIBUTING.md](CONTRIBUTING.md): How to contribute and what to check before pushing

## Scripts

- `pnpm run dev`: Start the dev server
- `pnpm run build`: Production build
- `pnpm run start`: Serve the production build

The mass-upload flow is available at **/mass-upload**.
