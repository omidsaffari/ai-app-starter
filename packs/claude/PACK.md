# claude pack — hosted agent harness (Claude Managed Agents, SDK 0.112.3 pinned)

Turns the starter into a **server-side Claude agent** behind the Labs chat
surface: long-running sessions on Anthropic's managed harness with a
sandboxed toolset, human approvals, custom tools, MCP servers, skills,
persistent memory, and rubric-graded outcomes — all rendered through the
existing kit (MessageScroller, Bubble, Attachment, Marker).

Apply: `bun scripts/apply-pack.ts claude && bun install`

Claude Managed Agents is in **beta** (`managed-agents-2026-04-01`, sent
automatically by the pinned SDK; memory-store calls use
`agent-memory-2026-07-22` instead — never both on one request). Behaviors
may be refined between releases: the SDK version is pinned exact; upgrade
deliberately and re-verify event shapes when you do.

**Source of truth for ALL Managed Agents APIs:**
<https://platform.claude.com/docs/en/managed-agents/overview>. Never write
Managed Agents code from memory; the surface is new and moving.

## What apply changes (trust-boundary shift)

- **Removed whole, never modified:** the BYOK surface (`src/app/api/run`,
  `byok.ts`, `secret.ts`, `capability*.ts`, `models.ts`, `create-model.ts`,
  `key-gate.tsx`, `model-selector.tsx`, `tests/byok.spec.ts`). There is no
  visitor key in a Managed Agents project — the agent loop runs on
  Anthropic's infrastructure against the DEPLOYMENT's `ANTHROPIC_API_KEY`.
- **The inbound trust boundary is now `src/app/api/agent/*`.** Every route
  builds the server-only client from `src/lib/agent/client.ts`, which
  **fails closed**: without `ANTHROPIC_API_KEY` in the server env, session
  routes return 503 with an honest JSON body, and `/api/agent/health`
  reports `{ ok: true, configured: false }`. A deployed copy costs nothing
  and can bill nobody until the deployer adds their own key. Do not "fix"
  the 503 by inlining a key or accepting one from the browser.
- **The browser talks ONLY to this app's routes.** No Anthropic call, ID,
  or credential ever reaches the client; the page consumes a same-origin
  SSE stream and posts events back.
- **Replaced:** `src/app/page.tsx`, `src/components/ai/chat-message.tsx`
  (+ barrel), `src/lib/project.ts`, Playwright spec → `tests/claude.spec.ts`
  (free — no model calls). The `ai`/`@ai-sdk/*` packages are removed; the
  kit renders Managed Agents session events instead of UIMessage parts.

## THE ZERO-COST CONTRACT (hard rules)

1. **We never pay for inference.** No author key, no author-hosted live
   playground. The README leads with the one-click **Deploy** button;
   whoever deploys, pays — their Anthropic API key, standard token rates.
   No demo GIF is required; never fake a demo asset.
2. **`bun run agent:setup` is free** — it only creates resources (agent,
   environment, memory store, skill upload). Tokens bill when sessions
   run.
3. **Scheduled deployments bill on cadence** against the deployer's key.
   `agent:setup --with-schedule` is opt-in, ships ONE conservative weekly
   schedule, and prints a loud cost warning. Delete the schedule when a
   project doesn't need one.
4. **`bun run agent:smoke` runs ONE real session turn** (billed, cents).
   Run it deliberately from your machine after gates are green. NEVER wire
   it into CI.
5. CI stays free: typecheck, `next build`, and the mount-smoke Playwright
   spec make zero API calls.

## The capability map (everything included, working)

| Capability | File | Shows |
|---|---|---|
| Agent definition | `src/lib/agent/definition.ts` | versioned agent config: system, toolset with `always_ask` on bash, custom tool, MCP + `mcp_toolset`, skills, haiku subagent roster |
| Environment | `src/lib/agent/definition.ts` | cloud sandbox with `limited` networking (their production guidance) |
| Provisioning | `scripts/agent-setup.ts` | create agent/environment/memory store, upload the skill, print IDs; `--with-schedule` for the cron deployment |
| Fail-closed client | `src/lib/agent/client.ts` | server-only SDK client; 503 without the key |
| Sessions | `src/app/api/agent/sessions/route.ts` | create + list sessions (memory store attached) |
| Live stream | `src/app/api/agent/sessions/[id]/stream/route.ts` | SSE proxy with `event_deltas` previews, history-seeded reconnect, server-side custom-tool execution |
| Events | `src/app/api/agent/sessions/[id]/events/route.ts` | `user.message`, `user.interrupt`, `user.tool_confirmation`, `user.define_outcome` |
| Deliverables | `src/app/api/agent/sessions/[id]/files/route.ts` | outcome outputs via the Files API (`scope_id`) |
| Webhooks | `src/app/api/agent/webhook/route.ts` | raw-body signature `unwrap()`, `event.id` retry dedupe |
| Health | `src/app/api/agent/health/route.ts` | deploy verification without billing |
| Client hook | `src/lib/agent/use-agent-session.ts` | EventSource consumer + delta accumulator (preview scratch, buffered event authoritative) |
| Event mapper | `src/components/ai/chat-message.tsx` | agent/tool/thinking events onto the kit; the HITL approval card (allow / deny + reason) |
| Surface | `src/app/page.tsx` | sessions, chat, interrupt, outcome composer, live cost meter from `session.usage` |
| Skill | `skill/` | custom SKILL.md (authoring rules: name may not contain "claude"/"anthropic") |
| Outcome rubric | `rubric.md` | explicit gradeable criteria for `user.define_outcome` |
| Free smoke | `tests/claude.spec.ts` | mounts, fails closed, zero model calls |

## Model policy

Default `claude-opus-4-8` ($5/$25 per MTok — the Managed Agents reference
model; supports mid-session `system.message`). Subagent roster uses
`claude-haiku-4-5` ($1/$5) — cost-tiered specialization. Alternates to
document in generated repos: `claude-sonnet-5` ($3/$15; intro $2/$10
through 2026-08-31) for cost-lean deployments, `claude-fable-5` ($10/$50)
for frontier capability. Model migration is a one-field agent update.
Verify current ids against the models docs at build time.

## Recipes (copy when the project needs them)

**Vault auth for MCP** (secrets never live on the agent; matched by EXACT
url at session time): create a vault + `static_bearer` credential keyed by
`mcp_server_url`, pass `vault_ids` at session creation. For OAuth servers
use `mcp_oauth` with a `refresh` block — Anthropic refreshes for you.

**Environment-variable credentials** (the fail-closed pattern): type
`environment_variable` stores a secret the sandbox only ever sees as an
opaque placeholder — the real value is substituted AT EGRESS, scoped by
`networking.allowed_hosts` and `injection_location: { header: true }`.
Injection can't leak what never enters the sandbox. Not available on
self-hosted sandboxes.

**GitHub work**: mount the repo as a session resource
(`{ type: "github_repository", url, mount_path, authorization_token }` —
clones are cached; token is write-only and rotatable mid-session) and pair
it with the GitHub MCP server (`https://api.githubcopilot.com/mcp/`) for
PRs/issues. Fine-grained PAT, minimum scopes.

**Outcome chaining**: after a terminal `span.outcome_evaluation_end`, send
the next `user.define_outcome` on the same session — history and sandbox
state carry forward.

**Memory discipline**: attach reference stores `read_only`. A read-write
store fed by untrusted input is a prompt-injection PERSISTENCE vector —
poisoned memory reads as trusted context in later sessions. Memories cap
at 100 kB each, 2,000 per store, 8 stores per session.

**Self-hosted sandboxes** (compliance / private networks): keep the
harness on Anthropic's side, run tool execution on your infra with an
environment worker. Official guides exist for Vercel Sandbox
(<https://vercel.com/kb/guide/run-claude-managed-agent-tools-with-vercel-sandbox>)
and Cloudflare, Daytona, E2B, Modal, and others. The worker authenticates
with a Console-generated ENVIRONMENT key — the org API key never touches
the worker host.

**Gated previews** (request access; mention, don't build): Dreams (memory
curation from session transcripts) and MCP tunnels (private-network MCP
without inbound ports).

## Foot-guns (learned once, kept forever)

- Open the event stream BEFORE sending the first event — streams only
  deliver events emitted after they attach. Reconnect = open stream, list
  history, seed seen-IDs, tail with dedupe.
- Event-delta previews are best-effort scratch; the buffered
  `agent.message` (same id) is the record, and `span.model_request_end`
  closes any preview whose buffered event never arrives.
- Session `agent` overrides and mid-session `tools`/`mcp_servers` updates
  REPLACE arrays in full — GET, modify, POST back.
- Every `mcp_servers` entry needs a matching `mcp_toolset` and vice versa
  or the API rejects the agent definition.
- Sandbox checkpoints expire 30 days after last activity (history
  persists; the filesystem doesn't).
- Webhooks: verify over the RAW body; retries reuse `event.id` (dedupe on
  it); the signing secret is shown exactly once at endpoint creation.
- Cron schedules match wall clock: spring-forward times are skipped,
  fall-back times fire twice. Schedule outside 1–3 AM local or use UTC.
- Coordinator rosters pin subagent versions at coordinator create/update —
  updating a subagent does not propagate until the coordinator is updated.
- Sessions wait INDEFINITELY on `requires_action` — surface pending
  approvals loudly in the UI.

## Dev loop

- `.env.local`: `ANTHROPIC_API_KEY`, then the IDs `agent:setup` prints
  (`AGENT_ID`, `ENVIRONMENT_ID`, `MEMORY_STORE_ID`), optionally
  `ANTHROPIC_WEBHOOK_SIGNING_KEY`. Gitignored; never print values.
- `bun run agent:setup` once per workspace (re-run prints existing usage).
- `bun dev` → create a session → each turn is a real billed model call.
  The bash approval card is the first thing to demo: ask for something
  that runs a command, then allow/deny it.
- Console (platform.claude.com) has the session tracing timeline — use it
  when debugging instead of guessing.
- Webhooks (optional locally): register the deployed URL in Console >
  Webhooks, store the `whsec_` secret.

## README language for generated repos

Lead with: **"Deploy your own copy — it runs on YOUR Anthropic account"**
(Deploy button + `vercel deploy`), then the capability list, then the
fail-closed note: a fresh deployment serves the UI and health check but
returns 503 on sessions until `ANTHROPIC_API_KEY` is set — that is the
design, not a bug. Branding: the product keeps its own neutral name with
"Powered by Claude" allowed; never "Claude Code"/"Claude Cowork" naming or
Claude-Code-style ASCII art, and skill names must not contain "claude" or
"anthropic".
