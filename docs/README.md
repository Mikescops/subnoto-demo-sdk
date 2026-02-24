# Subnoto SDK demo - Documentation

This repo is a demo app that shows how to use the Subnoto SDK and embed the signing flow in an iframe. It includes:

- **Create & Sign**: Create a single envelope from a sample PDF, add a recipient and signature block, send without email, and open the signing experience in an iframe.
- **Mass upload**: Create many envelopes in one batch (same PDF, random titles) and open any of them in the iframe.
- **Devis**: Build a quote PDF from a form with a live preview, send it for signature using Smart Anchors (recipient and signature block are read from the PDF), then open signing in an iframe.
- **Standalone iframe**: Reference for embedding the signing UI in a minimal HTML page.

Use it as a reference when integrating the Subnoto API and embedding the signing flow in your own product.

## Docs

- [Getting started](getting-started.md): Prerequisites, setup, env vars, and how to run each demo.
- [Customer implementation](customer-implementation.md): Step-by-step tutorial to implement the same logic on your side (API client, envelope creation, iframe token, status, mass creation).
- [Embed library](embed-library.md): How to use `@subnoto/embed-react` and the `SignEmbed` component in your React app.
