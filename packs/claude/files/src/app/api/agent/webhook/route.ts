import { getAgentClient } from "@/lib/agent/client";

/**
 * Webhook receiver for session/deployment lifecycle (register the deployed
 * URL in Console > Webhooks; the whsec_ signing secret is shown exactly once
 * — store it as ANTHROPIC_WEBHOOK_SIGNING_KEY).
 *
 * Signature verification runs over the RAW body. Retries reuse the same
 * event.id, so delivery is deduped on it. Fail-closed: without the signing
 * key this endpoint refuses instead of blindly acknowledging.
 */
const seenIds = new Set<string>();
const seenOrder: string[] = [];
const SEEN_CAP = 500;

export async function POST(req: Request): Promise<Response> {
	const client = getAgentClient();
	if (!client || !process.env.ANTHROPIC_WEBHOOK_SIGNING_KEY) {
		return Response.json({ error: "not_configured" }, { status: 503 });
	}

	const raw = await req.text();
	let event: { id: string; data: { type: string; id: string } };
	try {
		event = client.beta.webhooks.unwrap(raw, {
			headers: Object.fromEntries(req.headers),
		}) as typeof event;
	} catch {
		return new Response("invalid signature", { status: 400 });
	}

	if (seenIds.has(event.id)) return new Response(null, { status: 204 });
	seenIds.add(event.id);
	seenOrder.push(event.id);
	if (seenOrder.length > SEEN_CAP) {
		const oldest = seenOrder.shift();
		if (oldest) seenIds.delete(oldest);
	}

	switch (event.data.type) {
		case "session.status_idled":
			// The session is waiting — possibly on an approval card. Wire your
			// notification channel here (email, Slack, push) so approvals-while-away
			// don't stall for hours.
			console.log(`[agent webhook] session idled: ${event.data.id}`);
			break;
		case "deployment_run.failed":
		case "deployment.paused":
			console.log(`[agent webhook] ${event.data.type}: ${event.data.id}`);
			break;
		default:
			break;
	}

	return new Response(null, { status: 204 });
}
