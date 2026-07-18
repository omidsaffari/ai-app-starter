"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The browser side of the session: one same-origin EventSource, the
 * event-delta accumulator, and the send helpers. No Anthropic call or
 * credential ever lives here — everything rides this app's own routes.
 *
 * Accumulator contract (the platform's rules):
 *   previews are scratch keyed by the announced event id; the buffered
 *   agent.message with the same id is the record and replaces its preview;
 *   span.model_request_end closes any preview whose buffered event never
 *   arrived. Every (re)connect replays full history first, so the transcript
 *   resets on open and rebuilds — reconnects are free.
 */

export type AgentEvent = {
	type: string;
	id?: string;
	name?: string;
	agent_name?: string;
	input?: Record<string, unknown>;
	content?: Array<{ type: string; text?: string }>;
	error?: { message?: string; type?: string };
	stop_reason?: { type?: string; event_ids?: string[] };
	result?: string;
	explanation?: string;
	iteration?: number;
	[key: string]: unknown;
};

export type PendingApproval = { eventId: string; name: string; input: Record<string, unknown> };

export type SessionUsage = {
	input_tokens?: number;
	output_tokens?: number;
	cache_read_input_tokens?: number;
	cache_creation_input_tokens?: number;
};

type DeltaEvent = {
	type: "event_delta";
	event_id: string;
	delta: { index?: number; content?: { text?: string } };
};

export function useAgentSession(sessionId: string | null): {
	events: AgentEvent[];
	previews: Record<string, string>;
	status: string;
	busy: boolean;
	pendingApprovals: PendingApproval[];
	usage: SessionUsage | null;
	connectionError: string | null;
	sendMessage: (text: string) => Promise<void>;
	interrupt: () => Promise<void>;
	confirmTool: (eventId: string, result: "allow" | "deny", denyMessage?: string) => Promise<void>;
	defineOutcome: (description: string, rubric: string, maxIterations: number) => Promise<void>;
} {
	const [events, setEvents] = useState<AgentEvent[]>([]);
	const [previews, setPreviews] = useState<Record<string, string>>({});
	const [status, setStatus] = useState<string>("idle");
	const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
	const [usage, setUsage] = useState<SessionUsage | null>(null);
	const [connectionError, setConnectionError] = useState<string | null>(null);
	const [optimisticBusy, setOptimisticBusy] = useState(false);
	// Optimistic user bubbles echo locally; matching server copies are skipped once.
	const localEcho = useRef<Set<string>>(new Set());
	const eventsById = useRef<Map<string, AgentEvent>>(new Map());
	const previewIndexes = useRef<Map<string, Map<number, string>>>(new Map());

	const refreshUsage = useCallback(async (id: string) => {
		const res = await fetch(`/api/agent/sessions/${id}`);
		if (!res.ok) return;
		const data = (await res.json()) as { usage?: SessionUsage };
		if (data.usage) setUsage(data.usage);
	}, []);

	useEffect(() => {
		if (!sessionId) return;
		const source = new EventSource(`/api/agent/sessions/${sessionId}/stream`);
		let open = true;

		const reset = () => {
			setEvents([]);
			setPreviews({});
			setPendingApprovals([]);
			setConnectionError(null);
			eventsById.current = new Map();
			previewIndexes.current = new Map();
		};
		source.onopen = reset;

		const appendPreviewDelta = (delta: DeltaEvent) => {
			const byIndex = previewIndexes.current.get(delta.event_id) ?? new Map<number, string>();
			const index = delta.delta.index ?? 0;
			byIndex.set(index, (byIndex.get(index) ?? "") + (delta.delta.content?.text ?? ""));
			previewIndexes.current.set(delta.event_id, byIndex);
			const joined = [...byIndex.entries()]
				.sort(([a], [b]) => a - b)
				.map(([, text]) => text)
				.join("");
			setPreviews((prev) => ({ ...prev, [delta.event_id]: joined }));
		};

		const closePreview = (eventId: string) => {
			previewIndexes.current.delete(eventId);
			setPreviews((prev) => {
				if (!(eventId in prev)) return prev;
				const next = { ...prev };
				delete next[eventId];
				return next;
			});
		};

		source.onmessage = (message) => {
			const event = JSON.parse(message.data) as AgentEvent;
			if (!open) return;

			switch (event.type) {
				case "event_start":
					return;
				case "event_delta":
					appendPreviewDelta(event as unknown as DeltaEvent);
					return;
				case "app.history_complete":
					return;
				case "app.stream_error":
					setConnectionError(typeof event.message === "string" ? event.message : "stream error");
					return;
				default:
					break;
			}

			if (event.id) {
				if (eventsById.current.has(event.id)) return;
				eventsById.current.set(event.id, event);
				closePreview(event.id);
			}
			if (event.type === "span.model_request_end") {
				previewIndexes.current.clear();
				setPreviews({});
			}

			if (event.type === "user.message") {
				const text = (event.content ?? [])
					.map((block) => block.text ?? "")
					.join("")
					.trim();
				if (localEcho.current.has(text)) {
					localEcho.current.delete(text);
					return;
				}
			}

			if (event.type.startsWith("session.status_") && !event.type.startsWith("session.thread")) {
				const nextStatus = event.type.replace("session.status_", "");
				setStatus(nextStatus);
				setOptimisticBusy(false);
				if (nextStatus === "idle") {
					void refreshUsage(sessionId);
					if (event.stop_reason?.type === "requires_action") {
						const approvals: PendingApproval[] = [];
						for (const eventId of event.stop_reason.event_ids ?? []) {
							const use = eventsById.current.get(eventId);
							// Custom tools are answered server-side; only human-gated tools land here.
							if (use && (use.type === "agent.tool_use" || use.type === "agent.mcp_tool_use")) {
								approvals.push({ eventId, name: use.name ?? "tool", input: use.input ?? {} });
							}
						}
						setPendingApprovals(approvals);
					} else {
						setPendingApprovals([]);
					}
				} else {
					setPendingApprovals([]);
				}
			}

			setEvents((prev) => [...prev, event]);
		};

		source.onerror = () => {
			// EventSource reconnects on its own; the server replays history on attach.
		};

		return () => {
			open = false;
			source.close();
		};
	}, [sessionId, refreshUsage]);

	const post = useCallback(
		async (bodyEvents: Array<Record<string, unknown>>) => {
			if (!sessionId) return;
			const res = await fetch(`/api/agent/sessions/${sessionId}/events`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ events: bodyEvents }),
			});
			if (!res.ok) {
				const data = (await res.json().catch(() => null)) as { message?: string } | null;
				throw new Error(data?.message ?? `send failed (${res.status})`);
			}
		},
		[sessionId],
	);

	const sendMessage = useCallback(
		async (text: string) => {
			localEcho.current.add(text.trim());
			setEvents((prev) => [
				...prev,
				{ type: "user.message", id: `local-${Date.now()}`, content: [{ type: "text", text }] },
			]);
			setOptimisticBusy(true);
			await post([{ type: "user.message", content: [{ type: "text", text }] }]);
		},
		[post],
	);

	const interrupt = useCallback(async () => {
		await post([{ type: "user.interrupt" }]);
	}, [post]);

	const confirmTool = useCallback(
		async (eventId: string, result: "allow" | "deny", denyMessage?: string) => {
			setPendingApprovals((prev) => prev.filter((approval) => approval.eventId !== eventId));
			setOptimisticBusy(true);
			await post([
				{
					type: "user.tool_confirmation",
					tool_use_id: eventId,
					result,
					...(result === "deny" ? { deny_message: denyMessage ?? "Denied from the app." } : {}),
				},
			]);
		},
		[post],
	);

	const defineOutcome = useCallback(
		async (description: string, rubric: string, maxIterations: number) => {
			setOptimisticBusy(true);
			await post([
				{
					type: "user.define_outcome",
					description,
					rubric: { type: "text", content: rubric },
					max_iterations: maxIterations,
				},
			]);
		},
		[post],
	);

	return {
		events,
		previews,
		status,
		busy: optimisticBusy || status === "running" || status === "rescheduling",
		pendingApprovals,
		usage,
		connectionError,
		sendMessage,
		interrupt,
		confirmTool,
		defineOutcome,
	};
}
