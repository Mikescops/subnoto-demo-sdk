# Contributing

Thanks for your interest in contributing to this demo app.

## Setup

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd sdk-demo
   pnpm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` in the project root and set your Subnoto credentials. **Never commit `.env` or `.env.local`** — they are gitignored. See [docs/getting-started.md](docs/getting-started.md).

3. **Run**

   ```bash
   pnpm run dev
   ```

   Open http://localhost:3000.

## Before you push

- Run `pnpm run build` to ensure the project builds.
- Run `git status` and ensure no `.env` or `.env.local` files are staged. If you ever committed secrets by mistake, rotate the affected keys and remove the files from history (e.g. with `git filter-branch` or BFG).

## Pull requests

Open a PR with a clear description of the change. The CI workflow will run install and build.

## Security

See [SECURITY.md](SECURITY.md) for how to report vulnerabilities and how we handle secrets.
