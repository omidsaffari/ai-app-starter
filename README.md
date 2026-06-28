# AI App Starter

> A bring-your-own-key chat + image demo — paste your own API key; it never leaves your session.

**Live demo:** _(set per deploy)_ · **Built by** [Omid Saffari](https://github.com/omidsaffari)

The Omid Saffari Labs golden template: a provider-agnostic BYOK Next.js app with a
shadcn design system, a simplified dashboard shell, and an AI component kit. Out of
the box it's a single conversation surface that streams markdown text **and**
renders in-conversation images on your own OpenAI key. It's the foundation every
future Labs demo clones — swap one model-call file and the copy, keep the shell +
BYOK core untouched.

## Bring your own key

This is a **BYOK** app: you paste your own API key in the browser. The key is
kept in `sessionStorage`, sent only to this app's own `/api/run` route for the
duration of a request, and **never stored, logged, or sent anywhere else**. No
key of the author's is involved — you pay only for your own usage.

## Architecture

For generated releases, `README.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`,
`CHANGELOG.md`, `assets/og.png`, and app share-preview images are produced by
the oss-autopilot package step from `package-metadata.json`. Do not hand-design
the OG card per release.

- **Next.js (App Router)** on Vercel; **Tailwind v4** + shadcn (Base UI) + HugeIcons.
- BYOK key handling in `src/lib/byok.ts` + `src/lib/secret.ts` (the trust boundary).
- The model call lives in `src/lib/capability.ts` — OpenAI Responses + the hosted
  image-generation tool, via the **AI SDK v6** (`streamText`), streamed.
- `src/app/api/run/route.ts` is the BYOK proxy: it reads the `x-provider-key`
  header, builds the provider client with that key, and streams a UI-message
  response. The key never sits in the browser bundle or any log.
- The shell + AI kit live in `src/components/{shell,ai,ui}/`. See `AGENTS.md` for
  the editable-vs-frozen map and the full kitchen inventory.

## Run locally

```bash
bun install
bun dev          # http://localhost:3000 — paste your key and go
```

## Develop

```bash
bun run lint        # Biome
bun run typecheck   # tsc
bun run build       # production build
bun run test        # Playwright: BYOK no-leak + smoke
```

## License

MIT © Omid Saffari
