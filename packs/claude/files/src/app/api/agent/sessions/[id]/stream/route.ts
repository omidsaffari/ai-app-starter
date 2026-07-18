import { getAgentClient, isConfigured, notConfiguredResponse } from "@/lib/agent/client";
import { CUSTOM_TOOL_HANDLERS } from "@/lib/agent/definition";

export const dynamic = "force-dynamic";

/** The narrow view of session events this proxy needs; everything else passes through. */
type AnyEvent = {
	type: string;
	id?: string;
	name?: string;
	input?: Record<string, unknown>;
	stop_reason?: { type?: string; event_ids?: string[] };
};

/**
 * Same-origin SSE bridge: live stream + full history + custom-tool execution.
 *
 * Order matters (the platform's own reconnect recipe): the live stream opens
 * FIRST (streams only deliver events emitted after they attach), then history
 * seeds the transcript and the dedupe set, then the live tail is forwarded.
 * `app.history_complete` marks the seam for the client accumulator.
 *
 * Custom tools execute HERE — the browser never sees a credential and the
 * sandbox never sees this process. Tool confirmations are NOT auto-answered;
 * those belong to the human behind the approval card.
 */
export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	const client = getAgentClient();
	if (!client || !isConfigured()) return notConfiguredResponse();
	const { id } = await params;

	const encoder = new TextEncoder();
	const live = await client.beta.sessions.events.stream(id, {
		event_deltas: ["agent.message"],
	});
	req.signal.addEventListener("abort", () => live.controller.abort());

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const send = (data: unknown) =>
				controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
			const seen = new Set<string>();
			const customToolUses = new Map<string, { name: string; input: Record<string, unknown> }>();

			const track = (event: AnyEvent) => {
				if (event.type === "agent.custom_tool_use" && event.id && event.name) {
					customToolUses.set(event.id, { name: event.name, input: event.input ?? {} });
				}
			};

			const answerCustomTools = async (event: AnyEvent) => {
				if (event.type !== "session.status_idle") return;
				if (event.stop_reason?.type !== "requires_action") return;
				for (const eventId of event.stop_reason.event_ids ?? []) {
					const use = customToolUses.get(eventId);
					if (!use) continue; // a tool confirmation — the approval card handles it
					const handler = CUSTOM_TOOL_HANDLERS[use.name];
					const result = handler
						? await handler(use.input).catch((err: unknown) => `tool failed: ${String(err)}`)
						: `no handler registered for custom tool: ${use.name}`;
					await client.beta.sessions.events.send(id, {
						events: [
							{
								type: "user.custom_tool_result",
								custom_tool_use_id: eventId,
								content: [{ type: "text", text: result }],
							},
						],
					});
				}
			};

			try {
				for await (const past of client.beta.sessions.events.list(id)) {
					const event = past as unknown as AnyEvent;
					if (event.id) seen.add(event.id);
					track(event);
					send(event);
				}
				send({ type: "app.history_complete" });

				for await (const raw of live) {
					const event = raw as unknown as AnyEvent;
					// Delta previews have no id and are never persisted — forward as-is.
					if (event.type === "event_start" || event.type === "event_delta") {
						send(event);
						continue;
					}
					if (event.id) {
						if (seen.has(event.id)) continue;
						seen.add(event.id);
					}
					track(event);
					send(event);
					await answerCustomTools(event);
				}
			} catch (err) {
				if (!req.signal.aborted) {
					send({
						type: "app.stream_error",
						message: err instanceof Error ? err.message : "stream failed",
					});
				}
			} finally {
				try {
					controller.close();
				} catch {
					// already closed by cancel
				}
			}
		},
		cancel() {
			live.controller.abort();
		},
	});

	return new Response(stream, {
		headers: {
			"content-type": "text/event-stream",
			"cache-control": "no-cache, no-transform",
			connection: "keep-alive",
		},
	});
}
