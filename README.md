# {{PROJECT_NAME}}

> {{ONE_LINE_TAGLINE}}

**Live demo:** {{DEMO_URL}} · **Built by** [Omid Saffari](https://github.com/omidsaffari)

{{WHAT_IT_IS — 2-3 sentences: the problem, who it's for, what makes it interesting.}}

## Bring your own key

This is a **BYOK** app: you paste your own API key in the browser. The key is
kept in `sessionStorage`, sent only to this app's own `/api/run` route for the
duration of a request, and **never stored, logged, or sent anywhere else**. No
key of the author's is involved — you pay only for your own usage.

## Architecture

- **Next.js (App Router)** on Vercel.
- BYOK key handling in `src/lib/byok.ts` + `src/lib/secret.ts` (the trust boundary).
- The model call lives in `src/lib/capability.ts` — {{PROVIDER}} ({{MODEL}}), streamed.
- `src/app/api/run/route.ts` proxies the key per-request so it never sits in the browser bundle.

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
