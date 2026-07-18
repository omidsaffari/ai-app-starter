import { agentIds, isConfigured } from "@/lib/agent/client";

/** Deploy verification without billing: always 200, honest about config. */
export async function GET(): Promise<Response> {
	const { agentId, environmentId } = agentIds();
	return Response.json({
		ok: true,
		configured: isConfigured(),
		agent: Boolean(agentId),
		environment: Boolean(environmentId),
	});
}
