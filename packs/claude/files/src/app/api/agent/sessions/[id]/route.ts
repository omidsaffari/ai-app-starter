import { getAgentClient, isConfigured, notConfiguredResponse } from "@/lib/agent/client";

/** Session detail: status, cumulative token usage, outcome evaluations. */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	const client = getAgentClient();
	if (!client || !isConfigured()) return notConfiguredResponse();
	const { id } = await params;

	const session = await client.beta.sessions.retrieve(id);
	return Response.json({
		id: session.id,
		title: session.title,
		status: session.status,
		usage: session.usage,
		outcome_evaluations: (session as unknown as { outcome_evaluations?: unknown[] })
			.outcome_evaluations,
	});
}
