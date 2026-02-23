# Getting started

## Prerequisites

- **Node.js** (v18+)
- **pnpm** (or npm/yarn)
- A **Subnoto workspace** and API credentials

## Setup

1. **Clone and install**

   ```bash
   pnpm install
   ```

2. **Environment variables**

   Copy `.env.example` to `.env` in the project root and fill in your credentials. All variable names and optional ones are listed in `.env.example`. Required:

   - `SUBNOTO_BASE_URL` – Subnoto API base URL (e.g. `https://enclave.subnoto.com`)
   - `SUBNOTO_ACCESS_KEY` – API access key
   - `SUBNOTO_SECRET_KEY` – API secret key
   - `WORKSPACE_UUID` – Workspace UUID

   Optional:

   - `SUBNOTO_EMBED_BASE_URL` – Base URL for the embed iframe (default: `https://app.subnoto.com`)
   - `SUBNOTO_UNATTESTED` – Set to `true` for unattested / dev usage if required

   The demo uses the **API key owner email** (from the `/public/utils/whoami` endpoint) as the signer for Create & Sign and Mass upload envelopes.

3. **Sample PDF**

   Place a file named `sample-multipage.pdf` in the `assets` folder. It is used by both the Create & Sign and Mass upload demos. If it’s missing, the app will show an error.

4. **Run the app**

   ```bash
   pnpm run dev
   ```

   Open http://localhost:3000.

## Demos

- **Create & Sign** (`/create-and-sign`) – Click “Create envelope and open signing”. One envelope is created from the sample PDF, a recipient and signature block are added, the envelope is sent with no email, and the signing iframe opens. Previously created unsigned envelopes are listed so you can reopen them.

- **Mass upload** (`/mass-upload`) – Set a count and delay, then “Run mass upload”. The app creates that many envelopes (same PDF, random titles), then lists them. Use “Open” on any row to open that envelope in the signing iframe.

- **Devis** (`/devis`) – Fill in the quote form; the PDF preview updates live. Click “Send for signature”. The app creates an envelope from the PDF with Smart Anchor detection (recipient and signature block come from the PDF), sends with no email, and opens the signing iframe.

- **Standalone iframe** (`/standalone`) – Describes how to embed the signing UI in a minimal HTML page using a token in the URL hash. See also `index.html` in the project root for a static example.

## Build and production

```bash
pnpm run build
pnpm run start
```
