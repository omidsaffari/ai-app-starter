# eve pack — durable backend agent (Vercel eve 0.24.6, pinned)

Turns the starter into a **server-side eve agent** behind the Labs chat
surface: durable sessions, typed tools with human approval, skills,
subagents, schedules, a sandbox, and connection OAuth — all rendered through
the existing kit (MessageScroller, Bubble, Attachment, Marker).

Apply: `bun scripts/apply-pack.ts eve && bun install`

Adapted from Apache-2.0 examples in vercel/eve (templates/web-chat-next,
frameworks/next). eve is in **preview** — the version is pinned exact; upgrade
deliberately and re-read the bundled docs when you do.

**Source of truth for ALL eve APIs: `node_modules/eve/docs/`** (versioned to
the install; start at README.md). Never write eve code from memory.

## What apply changes (trust-boundary shift)

- **Removed whole, never modified:** the BYOK surface (`src/app/api/run`,
  `byok.ts`, `secret.ts`, `capability*.ts`, `models.ts`, `create-model.ts`,
  `key-gate.tsx`, `model-selector.tsx`, `tests/byok.spec.ts`). There is no
  visitor key in an eve project — the agent runs server-side on the
  deployment's Vercel AI Gateway.
- **The inbound trust boundary is now `agent/channels/eve.ts`** (route auth,
  walked in order): `vercelOidc() → localDev() → placeholderAuth()`.
  `placeholderAuth` FAILS CLOSED in production — a deployed copy 401s browser
  visitors until the deployer wires their own auth (an `AuthFn` over their app
  session) or explicitly opts into `none()` for a public demo. Do not "fix"
  the 401 by removing auth.
- **Replaced:** `next.config.ts` (withEve), `src/app/page.tsx`,
  `src/components/ai/chat-message.tsx` (+ barrel), `src/lib/project.ts`,
  Playwright spec → `tests/eve.spec.ts` (free — no model calls).
- **ai jumps to v7** (eve requirement); the kit files that spoke ai\@6 are the
  ones replaced.

## THE ZERO-COST CONTRACT (hard rules)

1. **We never pay for inference.** No author key, no author-hosted live
   playground. The README leads with the one-click **Deploy** button and a
   recorded **GIF** of the agent working; whoever deploys, pays (their gateway,
   via OIDC — no keys to configure).
2. **Schedules bill deployed copies** (they become Vercel Crons). Ship at most
   one conservative schedule (`weekly-digest` is the pattern, weekly + loud
   warning) and delete it when a project doesn't need one.
3. **`eve eval` runs real turns** — run it deliberately from your machine
   against your own deployment. NEVER wire it into CI.
4. CI stays free: `eve build`, typecheck, `next build`, and the mount-smoke
   Playwright spec make zero model calls.

## The capability map (everything included, working)

| Capability | File | Shows |
|---|---|---|
| Agent config | `agent/agent.ts` | gateway model id + session token limits |
| Instructions | `agent/instructions.md` | persona + delegation policy |
| Channel auth | `agent/channels/eve.ts` | ordered AuthFn walk, fail-closed default |
| Tool + HITL | `agent/tools/save_note.ts` | zod schema, `approval: once()`, sandbox handle |
| Skill | `agent/skills/note-style.md` | flat-markdown skill, progressive disclosure |
| Sandbox | `agent/sandbox/sandbox.ts` + `workspace/` | defaultBackend, seeding, egress note |
| Subagent | `agent/subagents/researcher/` | required `description`, inherits nothing |
| Schedule | `agent/schedules/weekly-digest.ts` | cron task-mode + cost warning |
| Evals | `evals/` | config + an approval-path eval (`eve eval`) |
| Client | `src/app/page.tsx` + `chat-message.tsx` | `useEveAgent`, part-mapper, approvals UI |

Built-ins the agent already has without files: `bash`, `read_file`,
`write_file`, `glob`, `grep`, `web_fetch`, `web_search`, `todo`,
`ask_question`, `agent` (subagent spawner), `load_skill`,
`connection_search`. Override by authoring the slug; disable with
`disableTool()`.

## Recipes (copy when the project needs them)

**MCP connection** (`agent/connections/<name>.ts`; filename = connection name;
model calls tools as `<name>__<tool>`):

```ts
import { defineMcpClientConnection } from "eve/connections";
import { once } from "eve/tools/approval";

export default defineMcpClientConnection({
	url: "https://mcp.linear.app/mcp",
	description: "Linear workspace: issues, projects, cycles.",
	auth: { getToken: async () => ({ token: process.env.LINEAR_API_TOKEN ?? "" }) },
	tools: { allow: ["search_issues", "get_issue"] },
	approval: once(),
});
```

**Interactive OAuth via Vercel Connect** (sign-in card renders in the chat —
the kit already handles `authorization` parts):

```ts
import { connect } from "@vercel/connect/eve";
import { defineMcpClientConnection } from "eve/connections";

export default defineMcpClientConnection({
	url: "https://mcp.linear.app/mcp",
	description: "Linear workspace.",
	auth: connect("linear/<your-connect-uid>"),
});
```

**Real browser auth** (replace `placeholderAuth` when a deployment serves
humans):

```ts
import { type AuthFn, localDev, vercelOidc } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

function appSession(): AuthFn<Request> {
	return async (request) => {
		const session = await getYourSession(request);
		if (!session) return null;
		return {
			authenticator: "app",
			principalId: session.userId,
			principalType: "user",
			attributes: { email: session.email },
		};
	};
}
export default eveChannel({ auth: [appSession(), vercelOidc(), localDev()] });
```

**Slack channel** (`agent/channels/slack.ts`; credentials via Vercel Connect,
no bot token env):

```ts
import { connectSlackCredentials } from "@vercel/connect/eve";
import { slackChannel } from "eve/channels/slack";

export default slackChannel({ credentials: connectSlackCredentials("slack/<uid>") });
```

**Multiple named agents in one app** (next.config.ts):

```ts
export default withEve(nextConfig, {
	agents: { support: "./agents/support", billing: "./agents/billing" },
});
// client: useEveAgent({ agent: "support" })  ·  routes: /eve/agents/<name>/eve/v1/*
```

## Dev loop

- `bun x eve dev` — local server + TUI REPL (each turn is a real model call).
- `bun x eve info` — discovered surface + diagnostics; run FIRST when debugging.
- Schedules never fire on cadence in dev — dispatch manually:
  `POST http://localhost:3000/eve/v1/dev/schedules/weekly-digest`.
- Deploy: `bun x eve link` (gateway creds) then `vercel deploy`; verify with
  `GET /eve/v1/health`.

## README language for generated repos

Lead with: **"Deploy your own copy — it runs on YOUR Vercel account"** (Deploy
button + `vercel deploy`), a GIF of the agent working, then the capability
list. Never publish a URL that lets strangers spend our gateway.
