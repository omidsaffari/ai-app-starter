import { agentIds, getAgentClient, isConfigured, notConfiguredResponse } from "@/lib/agent/client";

export async function POST(req: Request): Promise<Response> {
	const client = getAgentClient();
	if (!client || !isConfigured()) return notConfiguredResponse();
	const { agentId, environmentId, memoryStoreId, vaultId } = agentIds();

	const body = (await req.json().catch(() => ({}))) as { title?: string };
	const session = await client.beta.sessions.create({
		// String form runs the agent's LATEST version; sessions pin from here on.
		agent: agentId as string,
		environment_id: environmentId as string,
		title: typeof body.title === "string" && body.title ? body.title.slice(0, 120) : "Session",
		// MCP credentials resolve from the vault by exact server URL at runtime.
		...(vaultId ? { vault_ids: [vaultId] } : {}),
		...(memoryStoreId
			? {
					resources: [
						{
							type: "memory_store" as const,
							memory_store_id: memoryStoreId,
							access: "read_write" as const,
							instructions:
								"Check for relevant prior context before starting; record durable decisions back as small focused files.",
						},
					],
				}
			: {}),
	});

	return Response.json({ id: session.id, title: session.title, status: session.status });
}

export async function GET(): Promise<Response> {
	const client = getAgentClient();
	if (!client || !isConfigured()) return notConfiguredResponse();
	const { agentId } = agentIds();

	const page = await client.beta.sessions.list({ agent_id: agentId, limit: 20 });
	return Response.json({
		sessions: page.data.map((s) => ({
			id: s.id,
			title: s.title,
			status: s.status,
			created_at: s.created_at,
			usage: s.usage,
		})),
	});
}
