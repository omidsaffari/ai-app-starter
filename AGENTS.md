# AI App Starter — autopilot contract

The Omid Saffari Labs golden template: a provider-agnostic, **BYOK**
(bring-your-own-key) Next.js app. The visitor pastes their own API key; it is
used per-request and never stored or logged. We pay nothing for inference, and
no API key of ours ever lives in a generated project.

## What you (the build agent) change

1. **`src/lib/capability.ts`** — the ONE logic slot. Replace the mock
   `runCapability` with the real provider call for this project's idea. Stream
   text back; read the key from `input.apiKey`.
   - Default provider: **OpenAI** (`openai` package, Responses API, streamed;
     `@openai/agents` for agent demos). Use **Anthropic** (`@anthropic-ai/sdk`,
     `messages.stream`) when the idea is better in Claude.
   - Add the chosen SDK to `package.json`. **Verify the current model id at
     build time — never hardcode a stale one.**
2. **`src/lib/project.ts`** — name, tagline, repo URL, and the key-field copy
   (label/placeholder for the chosen provider, e.g. `OpenAI API key (sk-…)`).
3. **`src/app/page.tsx`** — the demo UI for this specific capability.
4. **`README.md`** — fill the placeholders (what it is, demo link, architecture).

## What you must NOT touch (the trust boundary)

- **`src/lib/byok.ts` + `src/lib/secret.ts`** — BYOK key handling. The key stays
  in `sessionStorage`, is sent per-request via the `x-provider-key` header, and
  is redacted from every error. Never move it to localStorage, a cookie, a query
  string, the server env, or a log.
- **`src/app/api/run/route.ts`** — the proxy contract (key in header →
  capability → streamed response; key never logged).
- **`.github/workflows/ci.yml` + `tests/`** — the gates. They must pass unchanged.

## Hard rules

- **No server-side API key, ever.** BYOK only.
- Never log, store, or echo the visitor's key.
- All CI gates (lint, typecheck, build, secret scan, BYOK no-leak test) must be
  green **before** the repo is made public.
