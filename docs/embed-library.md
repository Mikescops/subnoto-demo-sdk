# Using the Subnoto embed library (`@subnoto/embed-react`)

The `@subnoto/embed-react` package provides a React component that embeds the Subnoto signing experience in your app. You pass an iframe token (and optionally a host); the component renders the signing UI in an iframe and builds the URL for you.

## Installation

```bash
pnpm add @subnoto/embed-react
# or
npm install @subnoto/embed-react
```

Requires React 17+.

## Getting an iframe token

The embed needs a one-time iframe token. Create it on your backend (e.g. server action or API route) with the Subnoto API:

```ts
const { data, error } = await client.POST("/public/authentication/create-iframe-token", {
    body: {
        workspaceUuid,
        envelopeUuid,
        signerEmail: "signer@example.com", // must match a recipient on the envelope
    },
});

if (error || !data?.iframeToken) {
    // handle error
    return;
}

// Pass data.iframeToken to your frontend and use it with SignEmbed
```

For the full flow (create envelope, then create token), see [Customer implementation, Embedding signing](customer-implementation.md#43-embedding-signing).

## The `SignEmbed` component

Import and use it:

```tsx
import { SignEmbed } from "@subnoto/embed-react";

function SigningView({ iframeToken, host }: { iframeToken: string; host?: string }) {
    return (
        <div style={{ width: "100%", height: "400px" }}>
            <SignEmbed token={iframeToken} host={host} title="Subnoto signing" className="my-sign-embed" />
        </div>
    );
}
```

### Props

| Prop          | Type    | Description                                                                                                      |
| ------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| **token**     | string  | Iframe token from `create-iframe-token`. The component builds the URL as `{host}/embeds/sign#t={token}`.         |
| **host**      | string? | Base URL of the Subnoto app (e.g. `https://app.subnoto.com`). If omitted, defaults to `https://app.subnoto.com`. |
| **iframeUrl** | string? | Pre-built full iframe URL. If set, `host` and `token` are ignored. Use this only if you build the URL yourself.  |
| **className** | string? | CSS class applied to the iframe.                                                                                 |
| **title**     | string? | Iframe `title` for accessibility (default: `"Subnoto signing"`).                                                 |

Prefer **token** (and **host** when you use a custom embed domain) so the library builds the URL and you do not duplicate the URL format. If your backend already returns a full URL, you can pass **iframeUrl** instead of token and host.

### Custom embed domain

If you use a custom embed base URL (e.g. via `SUBNOTO_EMBED_BASE_URL`), have your backend return both the token and the host, then pass them to `SignEmbed`:

```tsx
// Backend returns { iframeToken, host }
<SignEmbed token={iframeToken} host={host} title="Subnoto signing" />
```

If you omit `host`, the component uses `https://app.subnoto.com`.

## Example in this repo

This app uses `SignEmbed` with **token** and optional **host**:

- **Component**: `src/components/signing-iframe.tsx` wraps `SignEmbed` with a header (envelope ID, copy button).
- **State**: The create-and-sign and iframe-token flows return `{ iframeToken, host }` from the server; the client stores them and passes them to `SigningIframe`, which passes them to `SignEmbed`.

See `src/actions/iframe-token.ts` and `src/actions/create-one-envelope.ts` for how the token and host are produced and returned to the client.

## Summary

1. Install `@subnoto/embed-react`.
2. On the server, call `POST /public/authentication/create-iframe-token` to get `iframeToken` (and your embed base URL as `host` if needed).
3. On the client, render `<SignEmbed token={iframeToken} host={host} ... />` inside a container with a defined size (the iframe fills its parent).
