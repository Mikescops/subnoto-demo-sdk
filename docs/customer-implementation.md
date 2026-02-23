# Customer implementation tutorial

This guide walks through implementing the same logic on your side: setting up the API client, creating an envelope, embedding the signing iframe, and optionally checking status and doing mass creation.

Reference implementation in this repo:

- **Client & config** – `src/lib/subnoto-client.ts`, `src/lib/env.ts`
- **Create one envelope** – `src/actions/create-one-envelope.ts`
- **Create envelope from PDF with Smart Anchors (Devis)** – `src/actions/create-devis-envelope.ts`
- **Iframe token** – `src/actions/iframe-token.ts`
- **Envelope status** – `src/actions/envelope-status.ts`
- **Mass upload** – `src/actions/mass-upload.ts`

---

## 4.1 Setting up

**Environment variables**

- `SUBNOTO_BASE_URL` – API base URL (e.g. `https://enclave.subnoto.com`)
- `SUBNOTO_ACCESS_KEY` – API access key
- `SUBNOTO_SECRET_KEY` – API secret key
- `WORKSPACE_UUID` – Workspace UUID

**API client**

Install `@subnoto/api-client` and create the client where you run server-side code (e.g. Next.js server action, API route, or Node script):

```ts
import { SubnotoClient } from "@subnoto/api-client";

const client = new SubnotoClient({
    apiBaseUrl: process.env.SUBNOTO_BASE_URL!,
    accessKey: process.env.SUBNOTO_ACCESS_KEY!,
    secretKey: process.env.SUBNOTO_SECRET_KEY!,
    unattested: process.env.SUBNOTO_UNATTESTED === "true", // if needed for dev
});
const workspaceUuid = process.env.WORKSPACE_UUID!;
```

Validate that all four env vars are set before calling the API.

---

## 4.2 Creating an envelope

A full flow is: upload document → add recipients → add blocks (e.g. signature) → send.

**1. Upload document**

```ts
const { envelopeUuid, documentUuid } = await client.uploadDocument({
    workspaceUuid,
    fileBuffer: pdfBuffer, // Buffer (Node) or Uint8Array
    envelopeTitle: "My contract",
});
```

**2. Add recipients**

```ts
await client.POST("/public/envelope/add-recipients", {
    body: {
        workspaceUuid,
        envelopeUuid,
        recipients: [
            {
                type: "manual",
                email: "signer@example.com",
                firstname: "Jane",
                lastname: "Doe",
            },
        ],
    },
});
```

**3. Add signature block**

```ts
await client.POST("/public/envelope/add-blocks", {
    body: {
        workspaceUuid,
        envelopeUuid,
        documentUuid,
        blocks: [
            {
                type: "signature",
                page: "1",
                x: 100,
                y: 400,
                recipientEmail: "signer@example.com",
            },
        ],
    },
});
```

**4. Send**

To send without email (e.g. when you will open the signing link yourself):

```ts
await client.POST("/public/envelope/send", {
    body: {
        workspaceUuid,
        envelopeUuid,
        distributionMethod: "none",
    },
});
```

See `src/actions/create-one-envelope.ts` for the full flow and error handling.

---

## 4.2b Creating an envelope with Smart Anchors (Devis flow)

If your PDF already contains **Smart Anchors** (e.g. `{{ signer@example.com | signature | 180 | 60 }}`), you can create an envelope without calling add-recipients or add-blocks: the API detects recipients and blocks from the PDF.

**1. Create envelope from file with Smart Anchor detection**

```ts
const formData = new FormData();
formData.append("workspaceUuid", workspaceUuid);
formData.append("envelopeTitle", "My quote");
formData.append("file", pdfBlob, "document.pdf");
formData.append("detectSmartAnchors", "true");

const { data, error } = await client.POST("/public/envelope/create-from-file", {
    body: formData,
    bodySerializer: (b) => b as FormData,
});
// data.envelopeUuid, data.documentUuid
```

**2. Send** (same as above: `POST /public/envelope/send` with `distributionMethod: "none"`).

**3. Create iframe token** (same as above: `POST /public/authentication/create-iframe-token` with `signerEmail` matching the anchor).

You do **not** call add-recipients or add-blocks. See `src/actions/create-devis-envelope.ts` and `src/components/devis-pdf-document.tsx` (anchor in the PDF).

---

## 4.3 Embedding signing

To show the signing experience in an iframe, you need a one-time iframe token, then build the URL.

**Create iframe token**

```ts
const { data, error } = await client.POST("/public/authentication/create-iframe-token", {
    body: {
        workspaceUuid,
        envelopeUuid,
        signerEmail: "signer@example.com", // must match a recipient
    },
});

if (error || !data?.iframeToken) {
    // handle error
    return;
}
```

**Build iframe URL**

Base URL is typically `https://app.subnoto.com` (or your custom embed domain). Path is `/embeds/sign`. Token goes in the hash:

```ts
const embedBaseUrl = process.env.SUBNOTO_EMBED_BASE_URL ?? "https://app.subnoto.com";
const iframeUrl = `${embedBaseUrl}/embeds/sign#t=${data.iframeToken}`;
```

**Embed in the page**

```html
<iframe src="{iframeUrl}" title="Subnoto signing" allow="fullscreen" allowfullscreen />
```

See `src/lib/embed-url.ts` and `src/actions/iframe-token.ts`.

---

## 4.4 Checking envelope status and reopening

**Get envelope status**

```ts
const { data, error } = await client.POST("/public/envelope/get", {
    body: { workspaceUuid, envelopeUuid },
});
// data.status: "uploading" | "draft" | "approving" | "signing" | "complete" | "declined" | "canceled"
```

Use this to show “draft”, “signing”, “complete”, etc. in your UI.

**Reopen an existing envelope in the iframe**

Call the same create-iframe-token endpoint with the same `envelopeUuid` and `signerEmail`, then set the iframe `src` to the new URL. The signer can continue where they left off. See `src/actions/iframe-token.ts` and the “Open” flow in `src/components/create-and-sign.tsx`.

---

## 4.5 Mass / batch creation

To create many envelopes (e.g. same PDF, different titles):

1. Read the PDF once into a buffer.
2. Loop for the desired count:
    - Call the same “create envelope” steps (upload, add recipients, add blocks, send).
    - Optionally wait a short delay between calls (e.g. 200 ms) to avoid overloading the API.
    - Collect `envelopeUuid` (and optionally `documentUuid`, title) for each success; handle errors per item.
3. Return the list of created envelopes (and any errors) to the client.

See `src/actions/mass-upload.ts` and `src/actions/create-one-envelope.ts` (shared `createEnvelopeFromBuffer`).

---

## Summary

| Goal                             | Endpoint / method                                                            | Reference in repo                      |
| -------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------- |
| Create client                    | `new SubnotoClient({ ... })`                                                 | `src/lib/subnoto-client.ts`            |
| Upload document                  | `client.uploadDocument(...)`                                                 | `src/actions/create-one-envelope.ts`   |
| Create from file (Smart Anchors) | `POST /public/envelope/create-from-file` (with `detectSmartAnchors: "true"`) | `src/actions/create-devis-envelope.ts` |
| Add recipients                   | `POST /public/envelope/add-recipients`                                       | same                                   |
| Add blocks                       | `POST /public/envelope/add-blocks`                                           | same                                   |
| Send                             | `POST /public/envelope/send`                                                 | same                                   |
| Iframe token                     | `POST /public/authentication/create-iframe-token`                            | `src/actions/iframe-token.ts`          |
| Envelope status                  | `POST /public/envelope/get`                                                  | `src/actions/envelope-status.ts`       |
| Mass create                      | Loop over create flow + throttle                                             | `src/actions/mass-upload.ts`           |
