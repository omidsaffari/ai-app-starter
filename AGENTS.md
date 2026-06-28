# AI App Starter — autopilot contract

The Omid Saffari Labs golden template: a provider-agnostic, **BYOK**
(bring-your-own-key) Next.js app with a shadcn design system, a simplified
dashboard shell, and an AI component kit (the "Labs kitchen"). The visitor pastes
their own API key; it is used per-request and never stored or logged. We pay
nothing for inference, and no API key of ours ever lives in a generated project.

It ships as a working **chat + image** demo: a single conversation surface that
streams markdown text AND renders in-conversation images, all on the visitor's
key. Every future demo (~100 planned) clones this and swaps two files.

## What you (the build agent) change — the per-project slot

1. **`src/lib/capability.ts`** — the ONE logic slot. `buildCapability` builds the
   provider model from `input.apiKey` and returns `{ model, system?, tools? }`.
   The route runs `streamText` over it. Default: OpenAI Responses + the hosted
   `imageGeneration` tool (text + in-conversation images on one surface). Swap
   `createAnthropic` / `createGoogleGenerativeAI` + a model id for other providers.
   **Verify the current model id at build time — never trust a hardcoded one.**
2. **`src/lib/project.ts`** — name, tagline, repo URL, and the key-field copy
   (label/placeholder/help for the chosen provider).
3. **`src/app/page.tsx`** — the demo UI. Compose the kit (Shell + AI kit) for the
   specific capability; the default is a chat+image conversation.
4. **`package-metadata.json`** — release packaging metadata. The autopilot runner
   uses it to generate `README.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`,
   `CHANGELOG.md`, `assets/og.html`, and `assets/og.png`.

## What you must NOT touch — the trust boundary (frozen)

- **`src/lib/byok.ts` + `src/lib/secret.ts`** — BYOK key handling. The key stays
  in `sessionStorage`, rides per-request via the `x-provider-key` header (constant
  `PROVIDER_KEY_HEADER`), and is redacted from every error. Never move it to
  localStorage, a cookie, a query string, the server env, or a log.
- **`src/app/api/run/route.ts`** — the BYOK proxy: read `x-provider-key`, build
  the provider client with THAT key, `streamText`, stream a UI-message response;
  errors through `redactSecret`; store/log nothing.
- **`.github/workflows/ci.yml` + `tests/`** — the gates. They must pass unchanged.
- **`src/components/ai/*` (the kit's part contract)** — restyle freely, but keep
  the `UIMessage`-part mapping and the in-column `ImageFrame`. The page depends on
  it; the route's stream feeds it.

## Editable surfaces

- **`src/components/ui/*`** — shadcn primitives (Base UI). Edit directly, never wrap.
- **`src/components/shell/*`** — the simplified shell. Restyle / extend the panel
  content; keep the one-rail / one-panel / one-main shape.
- **`src/app/globals.css`** — the OKLCH token store (light + dark + sidebar +
  brand + streamdown typography). Tokens only.

## Package surface

Use `$OSS_AUTOPILOT_ROOT/templates/package-metadata.example.json` as the shape for
`package-metadata.json`. Do not hand-design the OG image. The release runner
renders the standard black card with the pixel Labs mark, left-aligned title,
and mono type/tagline. No decorative right-side graphics.

## The Labs kitchen — inventory

**Design system / tokens**
- `src/app/globals.css` — shadcn OKLCH palette (light/dark), `sidebar-*`, `--brand`,
  `--radius` scale, `[data-streamdown]` markdown typography, tw-animate + page/slide
  reveal keyframes, `.prose-chat` token bridge.
- `src/lib/utils.ts` — `cn` (clsx + tailwind-merge). `components.json` — shadcn config.
- `src/app/layout.tsx` — Geist sans/mono, `next-themes` ThemeProvider (default dark),
  TooltipProvider.

**UI primitives (`src/components/ui/`)** — `button`, `tooltip`, `sheet` (Base UI).

**Shell (`src/components/shell/`)** — `shell` (48px rail + 360px collapsible panel
+ centered `min(1200px)` main with dashed left divider; ⌘B toggle; mobile hamburger
Sheet), `icon-strip`, `panel`, `mode-toggle`. Dropped vs dvnc-cloud: org switcher,
multi-route panel map, hide-header/hide-panel routing, auth/AppProvider.

**AI kit (`src/components/ai/`)** — `chat-input` (textarea + send/stop), `markdown`
(Streamdown + `@streamdown/code`, blurIn streaming, HugeIcons chrome), `chat-message`
(User bubble + Assistant `UIMessage`-part mapper: text→markdown, image→ImageFrame,
reasoning→muted block), `image-frame` (in-column, NOT full-bleed), `empty-state`,
`index` barrel. Excluded from dvnc-cloud's imagi: the full-bleed image canvas + row.

**BYOK core** — `src/lib/byok.ts` (sessionStorage + `useByokKey` + `PROVIDER_KEY_HEADER`),
`src/lib/secret.ts` (`redactSecret`), `src/components/key-gate.tsx` (masked input,
testid hooks), `src/app/api/run/route.ts` (AI-SDK proxy), `src/lib/capability.ts` +
`capability-types.ts` (the model-call slot).

## The BYOK data flow

The key-gate writes the visitor's key to `sessionStorage` only. The page's
`useChat` uses a `DefaultChatTransport` whose resolvable `headers` function reads
the key fresh from sessionStorage on every send and attaches it as
`x-provider-key` on a same-origin POST to `/api/run`. The route reads that header,
builds the provider client with that key in `buildCapability`, runs `streamText`,
and returns `toUIMessageStreamResponse()` — text streams as markdown, the image
tool's output streams as file parts the in-column `ImageFrame` renders. Errors run
through `redactSecret(err, apiKey)`. The key is never stored, logged, echoed, or
sent anywhere but that one same-origin route.

## Hard rules

- **No server-side API key, ever.** BYOK only.
- Never log, store, or echo the visitor's key.
- All CI gates (lint, build, typecheck, secret scan, BYOK no-leak test) must be
  green **before** the repo is made public.
