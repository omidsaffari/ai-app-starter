"use client";

import {
	ArrowDown01Icon,
	ArtificialIntelligence03Icon,
	CheckmarkCircle02Icon,
	Copy01Icon,
	Key01Icon,
	Tick01Icon,
	Wrench01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { Markdown } from "@/components/ai/markdown";
import { Badge } from "@/components/ui/badge";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Message, MessageContent, MessageFooter } from "@/components/ui/message";
import type { AgentEvent, PendingApproval } from "@/lib/agent/use-agent-session";

/**
 * Maps Managed Agents SESSION EVENTS onto the kit. The transcript is the
 * event log itself: user/agent messages become bubbles, tool activity becomes
 * collapsible cards (with the HITL approval buttons when a permission policy
 * pauses the session), thinking and multiagent traffic become markers, and
 * outcome grading reports as status cards.
 */

function eventText(event: AgentEvent): string {
	return (event.content ?? []).map((block) => block.text ?? "").join("");
}

/** tool results reference their tool_use — index them so cards can pair up. */
export function buildResultIndex(events: AgentEvent[]): Map<string, AgentEvent> {
	const index = new Map<string, AgentEvent>();
	for (const event of events) {
		if (!event.type.endsWith("tool_result")) continue;
		const useId =
			(event.tool_use_id as string | undefined) ?? (event.custom_tool_use_id as string | undefined);
		if (useId) index.set(useId, event);
	}
	return index;
}

// ─── User message ────────────────────────────────────────────────────────────

export function UserEvent({ event }: { event: AgentEvent }) {
	const text = eventText(event);
	const [copied, setCopied] = useState(false);
	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [text]);

	if (!text) return null;
	return (
		<Message align="end" className="fade-in animate-in duration-200">
			<MessageContent>
				<Bubble align="end">
					<BubbleContent className="text-base whitespace-pre-wrap">{text}</BubbleContent>
				</Bubble>
				<MessageFooter className="sm:opacity-0 sm:transition-opacity sm:group-hover/message:opacity-100">
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={handleCopy}
						aria-label="Copy message"
						className="text-muted-foreground/50 hover:text-foreground"
					>
						<HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} size={12} />
					</Button>
				</MessageFooter>
			</MessageContent>
		</Message>
	);
}

// ─── Assistant text (buffered = the record; preview = live scratch) ──────────

export function AgentMessageEvent({ event }: { event: AgentEvent }) {
	const text = eventText(event);
	if (!text) return null;
	return (
		<Message className="fade-in animate-in duration-200">
			<MessageContent>
				<Bubble variant="ghost">
					<BubbleContent>
						<Markdown text={text} isStreaming={false} />
					</BubbleContent>
				</Bubble>
			</MessageContent>
		</Message>
	);
}

export function PreviewBubble({ text }: { text: string }) {
	if (!text) return null;
	return (
		<Message>
			<MessageContent>
				<Bubble variant="ghost">
					<BubbleContent>
						<Markdown text={text} isStreaming />
					</BubbleContent>
				</Bubble>
			</MessageContent>
		</Message>
	);
}

export function ThinkingEvent({ event }: { event: AgentEvent }) {
	const text = eventText(event);
	if (!text) return null;
	return (
		<div className="text-muted-foreground/70 border-border border-l-2 pl-3 text-sm leading-relaxed italic">
			{text}
		</div>
	);
}

// ─── Tool activity → collapsible card (+ the HITL approval buttons) ──────────

function toolResultValue(result: AgentEvent | undefined): unknown {
	if (!result) return undefined;
	const text = eventText(result);
	if (text) return text;
	return result.output ?? result.result ?? undefined;
}

export function ToolEventCard({
	event,
	result,
	approval,
	canRespond,
	onConfirm,
}: {
	event: AgentEvent;
	result?: AgentEvent;
	approval?: PendingApproval;
	canRespond: boolean;
	onConfirm: (eventId: string, decision: "allow" | "deny") => void | Promise<void>;
}) {
	const isCustom = event.type === "agent.custom_tool_use";
	const isMcp = event.type === "agent.mcp_tool_use";
	const state = approval ? "needs approval" : result ? "done" : "running";

	return (
		<Collapsible
			defaultOpen={Boolean(approval)}
			className="border-border w-full max-w-md rounded-lg border"
		>
			<CollapsibleTrigger className="group/tool hover:bg-muted/50 flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors">
				<HugeiconsIcon
					icon={approval ? Key01Icon : Wrench01Icon}
					size={14}
					className="text-muted-foreground shrink-0"
				/>
				<span className="min-w-0 flex-1 truncate text-left font-mono text-xs">
					{event.name ?? "tool"}
					{isMcp && <span className="text-muted-foreground/50"> · mcp</span>}
					{isCustom && <span className="text-muted-foreground/50"> · app</span>}
				</span>
				<Badge variant={approval ? "default" : "secondary"}>{state}</Badge>
				<HugeiconsIcon
					icon={ArrowDown01Icon}
					size={14}
					className="text-muted-foreground/50 shrink-0 transition-transform group-data-[panel-open]/tool:rotate-180"
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="flex flex-col gap-2 px-3 pb-3">
				{event.input !== undefined && <JsonBlock label="Input" value={event.input} />}
				{approval && (
					<div className="border-border bg-muted/50 flex flex-col gap-2 rounded-lg border p-3">
						<span className="text-muted-foreground text-xs leading-relaxed">
							The session is paused until you decide. Denying tells the agent why.
						</span>
						<div className="flex gap-2">
							<Button
								size="sm"
								disabled={!canRespond}
								data-testid="approve-tool"
								onClick={() => void onConfirm(approval.eventId, "allow")}
							>
								Allow
							</Button>
							<Button
								size="sm"
								variant="destructive"
								disabled={!canRespond}
								data-testid="deny-tool"
								onClick={() => void onConfirm(approval.eventId, "deny")}
							>
								Deny
							</Button>
						</div>
					</div>
				)}
				{toolResultValue(result) !== undefined && (
					<JsonBlock label="Output" value={toolResultValue(result)} />
				)}
			</CollapsibleContent>
		</Collapsible>
	);
}

// ─── Multiagent + lifecycle markers ──────────────────────────────────────────

export function ThreadMarker({ event }: { event: AgentEvent }) {
	const agentName = (event.from_agent_name ?? event.to_agent_name ?? event.agent_name) as
		| string
		| undefined;
	const label =
		event.type === "agent.thread_message_sent"
			? `→ ${agentName ?? "subagent"}`
			: event.type === "agent.thread_message_received"
				? `← ${agentName ?? "subagent"}`
				: event.type === "session.thread_created"
					? `${agentName ?? "subagent"} thread opened`
					: null;
	if (!label) return null;
	return (
		<Marker>
			<MarkerIcon>
				<HugeiconsIcon icon={ArtificialIntelligence03Icon} size={14} />
			</MarkerIcon>
			<MarkerContent className="font-mono text-xs">{label}</MarkerContent>
		</Marker>
	);
}

export function OutcomeEvent({ event }: { event: AgentEvent }) {
	if (event.type === "span.outcome_evaluation_start") {
		return (
			<Marker>
				<MarkerIcon>
					<HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
				</MarkerIcon>
				<MarkerContent>Grading iteration {(event.iteration ?? 0) + 1}…</MarkerContent>
			</Marker>
		);
	}
	if (event.type !== "span.outcome_evaluation_end") return null;
	const satisfied = event.result === "satisfied";
	return (
		<div className="border-border w-full max-w-md rounded-lg border p-3">
			<div className="flex items-center gap-2">
				<HugeiconsIcon
					icon={CheckmarkCircle02Icon}
					size={14}
					className={satisfied ? "text-foreground" : "text-muted-foreground"}
				/>
				<span className="text-sm font-medium">Outcome: {String(event.result)}</span>
				<Badge variant={satisfied ? "default" : "secondary"}>
					iteration {(event.iteration ?? 0) + 1}
				</Badge>
			</div>
			{event.explanation && (
				<p className="text-muted-foreground mt-2 text-xs leading-relaxed">
					{String(event.explanation)}
				</p>
			)}
		</div>
	);
}

export function SessionErrorEvent({ event }: { event: AgentEvent }) {
	return (
		<Bubble variant="destructive">
			<BubbleContent data-testid="chat-error" className="text-xs">
				{event.error?.message ?? "session error"}
			</BubbleContent>
		</Bubble>
	);
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-muted-foreground/70 text-[11px] font-medium tracking-wide uppercase">
				{label}
			</span>
			<pre className="bg-muted text-foreground max-h-48 overflow-auto rounded-lg p-2.5 font-mono text-xs leading-relaxed">
				{typeof value === "string" ? value : JSON.stringify(value, null, 2)}
			</pre>
		</div>
	);
}
