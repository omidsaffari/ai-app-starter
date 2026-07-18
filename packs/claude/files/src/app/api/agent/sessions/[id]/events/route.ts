import { getAgentClient, isConfigured, notConfiguredResponse } from "@/lib/agent/client";

/**
 * The browser's only write path into a session. Strict allowlist: the UI can
 * speak, interrupt, answer approval cards, and define outcomes — nothing else.
 * (Custom tool results are sent by the stream route, server-side.)
 */
const ALLOWED_EVENT_TYPES = new Set([
	"user.message",
	"user.interrupt",
	"user.tool_confirmation",
	"user.define_outcome",
]);

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	const client = getAgentClient();
	if (!client || !isConfigured()) return notConfiguredResponse();
	const { id } = await params;

	const body = (await req.json().catch(() => null)) as { events?: Array<{ type?: string }> } | null;
	if (!body?.events?.length) {
		return Response.json({ error: "bad_request", message: "events[] required" }, { status: 400 });
	}
	for (const event of body.events) {
		if (!event?.type || !ALLOWED_EVENT_TYPES.has(event.type)) {
			return Response.json(
				{ error: "bad_request", message: `event type not allowed: ${event?.type}` },
				{ status: 400 },
			);
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: pass-through to the SDK's event union after the allowlist check
	await client.beta.sessions.events.send(id, { events: body.events as any });
	return Response.json({ ok: true });
}
