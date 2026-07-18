import { project } from "@/lib/project";

/**
 * The agent, environment, memory-store, and schedule definitions —
 * `scripts/agent-setup.ts` sends these to the Managed Agents API once and
 * prints the resulting IDs. Editing here does NOT change live resources:
 * agents are versioned server-side, so re-run setup (or update by ID) to
 * publish a new version.
 *
 * Managed Agents reference: https://platform.claude.com/docs/en/managed-agents/overview
 */

export const DEFAULT_MODEL = "claude-opus-4-8";
export const SUBAGENT_MODEL = "claude-haiku-4-5";

/** GitHub's hosted MCP server. Only wired when setup runs --with-github-mcp
 * (needs a vault credential — the agent definition itself carries no secret). */
export const GITHUB_MCP_URL = "https://api.githubcopilot.com/mcp/";

export const RESEARCHER_DEFINITION = {
	name: `${project.name} researcher`,
	model: SUBAGENT_MODEL,
	system:
		"You are a research subagent. You receive one narrow question at a time from the coordinator. Answer it using web search and the sandbox, cite the sources you used, and reply with findings only — no plans, no meta-commentary.",
	tools: [{ type: "agent_toolset_20260401" as const }],
};

export function coordinatorDefinition(options: {
	researcherAgentId: string;
	skillId?: string;
	githubMcp?: boolean;
}): Record<string, unknown> {
	return {
		name: project.name,
		model: DEFAULT_MODEL,
		system: [
			`You are the ${project.name} agent: a careful operator working inside a sandboxed session.`,
			"Operating rules:",
			"- Work in /workspace. Write final deliverables to /mnt/session/outputs/ so the app can offer them for download.",
			"- Before starting substantive work, check the mounted memory store for relevant prior context; record durable decisions and user preferences back into it as small focused files.",
			"- Delegate narrow research questions to the researcher subagent instead of long browsing detours; fold its findings into your own work.",
			"- Bash commands require the user's approval — request them only when needed and explain what the command does in the surrounding message.",
			"- Be concrete and verifiable: prefer running code over speculating, and say plainly when something failed.",
		].join("\n"),
		tools: [
			{
				type: "agent_toolset_20260401" as const,
				// The toolset defaults to always_allow; bash is the blast-radius
				// tool, so it alone asks. This is what renders the approval card.
				configs: [{ name: "bash", permission_policy: { type: "always_ask" } }],
			},
			{
				type: "custom" as const,
				name: "app_info",
				description:
					"Returns live metadata about this deployment: app name, tagline, server region, uptime, and Node version. Use when the user asks about the app itself, its version, or where it is running. Executed by the host application, not in the sandbox.",
				input_schema: {
					type: "object" as const,
					properties: {
						detail: {
							type: "string",
							description: "Optional single aspect to return: name | region | uptime | runtime",
						},
					},
				},
			},
			...(options.githubMcp ? [{ type: "mcp_toolset" as const, mcp_server_name: "github" }] : []),
		],
		...(options.githubMcp
			? { mcp_servers: [{ type: "url" as const, name: "github", url: GITHUB_MCP_URL }] }
			: {}),
		...(options.skillId
			? {
					skills: [
						{ type: "custom" as const, skill_id: options.skillId, version: "latest" },
						{ type: "anthropic" as const, skill_id: "pdf" },
					],
				}
			: { skills: [{ type: "anthropic" as const, skill_id: "pdf" }] }),
		multiagent: {
			type: "coordinator" as const,
			agents: [{ type: "agent" as const, id: options.researcherAgentId }],
		},
	};
}

/**
 * Limited networking is Anthropic's own production guidance. The sandbox can
 * only reach package registries — but web_search/web_fetch are TOOLS, not
 * sandbox egress, so the agent still researches freely. Widen allowed_hosts
 * per project instead of flipping to unrestricted.
 */
export const ENVIRONMENT_DEFINITION = {
	name: `${project.name} sandbox`,
	config: {
		type: "cloud" as const,
		networking: {
			type: "limited" as const,
			allowed_hosts: [],
			allow_package_managers: true,
			allow_mcp_servers: true,
		},
	},
};

export const MEMORY_STORE_DEFINITION = {
	name: `${project.name} memory`,
	description:
		"Durable context for this agent across sessions: user preferences, project conventions, decisions already made, and lessons from prior work.",
};

export const MEMORY_SEED = {
	path: "/conventions.md",
	content:
		"Deliverables go in /mnt/session/outputs/. Keep memory files small and focused — one topic per file. Record decisions with a one-line rationale.",
};

/** ⚠ Bills the deployer's key on cadence once created. Weekly on purpose. */
export function scheduleDefinition(
	agentId: string,
	environmentId: string,
): Record<string, unknown> {
	return {
		name: `${project.name} weekly check-in`,
		agent: agentId,
		environment_id: environmentId,
		initial_events: [
			{
				type: "user.message",
				content: [
					{
						type: "text",
						text: "Review the memory store for open threads and produce a short status digest in /mnt/session/outputs/digest.md. If there is nothing open, say so and stop.",
					},
				],
			},
		],
		schedule: {
			type: "cron",
			// Friday 18:00 UTC — outside the 1–3 AM DST hazard window on purpose.
			expression: "0 18 * * 5",
			timezone: "UTC",
		},
	};
}

/**
 * Custom tools run HERE, on the server — never in the sandbox. The stream
 * route executes these when the session pauses on agent.custom_tool_use.
 * Permission policies do not cover custom tools; this registry is the policy.
 */
export const CUSTOM_TOOL_HANDLERS: Record<
	string,
	(input: Record<string, unknown>) => Promise<string>
> = {
	app_info: async (input) => {
		const info: Record<string, string> = {
			name: project.name,
			tagline: project.tagline,
			region: process.env.VERCEL_REGION ?? "local",
			uptime: `${Math.round(process.uptime())}s`,
			runtime: `node ${process.version}`,
		};
		const detail = typeof input.detail === "string" ? input.detail : undefined;
		if (detail && detail in info) return `${detail}: ${info[detail]}`;
		return Object.entries(info)
			.map(([k, v]) => `${k}: ${v}`)
			.join("\n");
	},
};
