# Subnoto SDK demo – Documentation

This repo is a **demo app** that showcases multiple aspects of the Subnoto SDK and iframe embedding:

- **Create & Sign** – Create a single envelope from a sample PDF, add a recipient and signature block, send with no email, and open the signing experience in an iframe.
- **Mass upload** – Create many envelopes in batch (same PDF, random titles) and open any of them in the iframe.
- **Devis** – Build a quote PDF from a form (with live preview), send for signature using Smart Anchors (recipient and signature block are detected from the PDF), then open signing in an iframe.
- **Standalone iframe** – Explanation and reference for embedding the signing UI in a minimal HTML page.

Use this app to see how to integrate the Subnoto API and embed the signing flow in your own product.

## Docs

- [Getting started](getting-started.md) – Prerequisites, setup, env vars, and how to run each demo.
- [Customer implementation](customer-implementation.md) – Step-by-step tutorial to implement the same logic on your side (API client, envelope creation, iframe token, status, mass creation).
- [Embed library](embed-library.md) – How to use `@subnoto/embed-react` and the `SignEmbed` component to embed the signing UI in your React app.
