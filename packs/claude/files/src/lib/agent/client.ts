import Anthropic from "@anthropic-ai/sdk";

/**
 * The server-only Anthropic client — THE trust boundary of this app.
 *
 * Fail-closed by design: without ANTHROPIC_API_KEY in the server env every
 * agent route answers 503 with an honest body, so a freshly deployed copy
 * serves the UI and health check but can bill nobody. The key never reaches
 * the browser; the browser only ever talks to this app's own routes.
 */

let cached: Anthropic | null = null;

export function getAgentClient(): Anthropic | null {
	if (!process.env.ANTHROPIC_API_KEY) return null;
	cached ??= new Anthropic();
	return cached;
}

export function agentIds(): {
	agentId?: string;
	environmentId?: string;
	memoryStoreId?: string;
	vaultId?: string;
} {
	return {
		agentId: process.env.AGENT_ID,
		environmentId: process.env.AGENT_ENVIRONMENT_ID,
		memoryStoreId: process.env.AGENT_MEMORY_STORE_ID,
		vaultId: process.env.AGENT_VAULT_ID,
	};
}

export function isConfigured(): boolean {
	const { agentId, environmentId } = agentIds();
	return Boolean(process.env.ANTHROPIC_API_KEY && agentId && environmentId);
}

/** The one honest error every route returns until the deployer configures keys. */
export function notConfiguredResponse(): Response {
	return Response.json(
		{
			error: "not_configured",
			message:
				"This deployment has no ANTHROPIC_API_KEY (or agent IDs) configured. Set ANTHROPIC_API_KEY, then run `bun run agent:setup` and add the printed AGENT_ID / AGENT_ENVIRONMENT_ID / AGENT_MEMORY_STORE_ID to the environment. Sessions run on the deployer's account by design.",
		},
		{ status: 503 },
	);
}
