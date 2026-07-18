# Packs — the authoring contract

A pack is ONE platform's backend, self-contained under `packs/<name>/`.
`bun scripts/apply-pack.ts <name>` applies exactly one (removals → files
overlay → package.json patch), then deletes `packs/` and itself. Published
repos carry one platform, the Labs design, and zero pack machinery. This
file is machinery: it never ships.

Every pack MUST provide:

1. **`pack.json`** — the manifest (shape documented in
   `scripts/apply-pack.ts`). Rules:
   - Pin exact dependency versions (`"@anthropic-ai/sdk": "0.112.3"`,
     `"eve": "0.24.6"`) — upgrades are deliberate, re-read the platform
     docs when you bump.
   - `remove` handles the trust-boundary swap **removal-only**: take the
     BYOK surface out whole (`src/app/api/run`, `byok.ts`, `secret.ts`,
     `capability*.ts`, `models.ts`, `create-model.ts`, `key-gate.tsx`,
     `model-selector.tsx`, `tests/byok.spec.ts`), never modify it.
   - `packageJson` patches merge verbatim: scripts, imports, overrides,
     `engines` if the platform needs a specific Node.
   - `postNotes` tells the applier the first three commands to run.

2. **`PACK.md`** — the contract once applied. Follow the eve pack's
   structure: what apply changes (the trust-boundary shift and the new
   inbound boundary), THE ZERO-COST CONTRACT, the capability map (a table:
   every capability included, which file shows it), recipes (copy-when-
   needed patterns), the dev loop, and README language for generated
   repos. Cost rules are non-negotiable in every pack: no author key, no
   author-hosted playground, deploy-button-first README, anything billed
   runs deliberately and never in CI.

3. **`files/`** — the overlay, copied onto the repo root. A pack
   typically replaces `src/app/page.tsx`, `src/components/ai/chat-message.tsx`
   (+ the `ai/index.ts` barrel), and `src/lib/project.ts`, and adds its own
   backend under `src/lib/<pack>/` + `src/app/api/`. The kit primitives
   (`ui/`, `shell/`, the chat stack) are the shared surface — packs map
   their platform's stream onto them and never fork them. The composition
   rule from AGENTS.md carries into every pack.

4. **`files/tests/<pack>.spec.ts`** — the free mount smoke. It must prove
   the applied app builds, mounts, and FAILS CLOSED without credentials —
   with **zero model calls**. The base `tests/byok.spec.ts` is removed by
   the manifest; your spec replaces it.

5. **A CI matrix entry** — add the pack name to the `pack-smoke` job's
   `matrix.pack` list in `.github/workflows/ci.yml`. The job applies the
   pack from a clean checkout and runs typecheck + build + the mount
   smoke. Platform-specific steps gate on `matrix.pack`.

Control-plane touches (outside this repo, same change set):

- A lane skill in `oss-autopilot/.agents/skills/oss-<pack>-flagship/`
  copying the eve lane skeleton (Scope → Scaffold → Fill → Enterprise Bar
  → Gate → deliberate billed pass → Publish → Report).
- The runner learns the lane in preflight/gate/metadata
  (`scripts/oss-release-runner.mjs`), including a per-lane gate that
  forbids the removed BYOK surface.
- One row in the shared `open-source-autopilot` contract table.

Naming: pack directories are internal (`packs/claude` is fine). Published
flagship repos follow the platform's branding rules — neutral product
names, no platform-product impersonation (for Anthropic: "X, powered by
Claude" is allowed; "Claude Code"-style naming is not, and skill names
must not contain "claude"/"anthropic").

Before the first flagship on a new pack: smoke the full apply→install→
build chain from a CLEAN COPY of the template. That is what made the
first eve run land on the first try.
