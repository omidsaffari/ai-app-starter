"use client";

import { Add01Icon, ArtificialIntelligence03Icon, File02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	AgentMessageEvent,
	buildResultIndex,
	ChatInput,
	ChatMessages,
	EmptyState,
	OutcomeEvent,
	PreviewBubble,
	SessionErrorEvent,
	ThinkingEvent,
	ThreadMarker,
	ToolEventCard,
	UserEvent,
} from "@/components/ai";
import { Panel, PanelDivider, PanelGuide, PanelItem, PanelList } from "@/components/panels/shared";
import { Shell } from "@/components/shell/shell";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { MessageScrollerItem } from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAgentSession } from "@/lib/agent/use-agent-session";
import { project } from "@/lib/project";

/**
 * The session surface for a Claude Managed Agents deployment. The agent loop,
 * sandbox, and tools run on Anthropic's infrastructure against THIS
 * deployment's key; the browser only ever talks to this app's own routes.
 * Fail-closed: an unconfigured deployment renders setup instructions and can
 * bill nobody.
 */

type SessionSummary = { id: string; title?: string; status?: string; created_at?: string };
type SessionFile = { id: string; filename?: string; size?: number };

const DEFAULT_RUBRIC = `# Deliverable rubric

## Content
- Answers the stated goal directly, with concrete specifics rather than generalities
- Claims that depend on facts cite where the fact came from

## Output quality
- Final files are written to /mnt/session/outputs/
- A short summary of what was produced ends the turn`;

export default function Home() {
	const [configured, setConfigured] = useState<boolean | null>(null);
	const [sessions, setSessions] = useState<SessionSummary[]>([]);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);

	const refreshSessions = useCallback(async () => {
		const res = await fetch("/api/agent/sessions");
		if (!res.ok) return;
		const data = (await res.json()) as { sessions: SessionSummary[] };
		setSessions(data.sessions);
	}, []);

	useEffect(() => {
		void fetch("/api/agent/health")
			.then((res) => res.json())
			.then((health: { configured: boolean }) => {
				setConfigured(health.configured);
				if (health.configured) void refreshSessions();
			})
			.catch(() => setConfigured(false));
	}, [refreshSessions]);

	const createSession = useCallback(async () => {
		setCreating(true);
		try {
			const res = await fetch("/api/agent/sessions", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ title: `Session ${new Date().toLocaleDateString()}` }),
			});
			if (res.ok) {
				const session = (await res.json()) as SessionSummary;
				setActiveId(session.id);
				void refreshSessions();
			}
		} finally {
			setCreating(false);
		}
	}, [refreshSessions]);

	if (configured === false) return <Unconfigured />;

	return (
		<SessionView
			key={activeId ?? "none"}
			sessions={sessions}
			activeId={activeId}
			onSelect={setActiveId}
			onCreate={createSession}
			creating={creating}
		/>
	);
}

/** The fail-closed face of a fresh deployment — no key input, by design. */
function Unconfigured() {
	return (
		<Shell
			panel={
				<Panel
					label="Setup"
					description={
						<PanelGuide
							steps={[
								"Set ANTHROPIC_API_KEY in the deployment environment — sessions run and bill on the deployer's account, never a visitor's.",
								"Run `bun run agent:setup` once; it creates the agent, sandbox environment, and memory store, then prints the IDs.",
								"Add AGENT_ID, AGENT_ENVIRONMENT_ID, and AGENT_MEMORY_STORE_ID to the environment and redeploy.",
							]}
						/>
					}
				/>
			}
		>
			<div data-testid="agent-unconfigured" className="flex h-svh flex-col">
				<div className="flex flex-1 items-center justify-center px-6">
					<EmptyState
						icon={ArtificialIntelligence03Icon}
						title={project.name}
						subtitle="This deployment is fail-closed: no API key is configured, so sessions are disabled and nothing can bill. Deploy your own copy and add your key — the panel has the three steps."
					/>
				</div>
			</div>
		</Shell>
	);
}

function SessionView({
	sessions,
	activeId,
	onSelect,
	onCreate,
	creating,
}: {
	sessions: SessionSummary[];
	activeId: string | null;
	onSelect: (id: string) => void;
	onCreate: () => void;
	creating: boolean;
}) {
	const session = useAgentSession(activeId);
	const [input, setInput] = useState("");
	const [files, setFiles] = useState<SessionFile[]>([]);
	const resultIndex = useMemo(() => buildResultIndex(session.events), [session.events]);
	const approvalsByEventId = useMemo(
		() => new Map(session.pendingApprovals.map((approval) => [approval.eventId, approval])),
		[session.pendingApprovals],
	);

	useEffect(() => {
		if (!activeId || session.status !== "idle") return;
		void fetch(`/api/agent/sessions/${activeId}/files`)
			.then((res) => (res.ok ? res.json() : { files: [] }))
			.then((data: { files: SessionFile[] }) => setFiles(data.files))
			.catch(() => undefined);
	}, [activeId, session.status]);

	const handleSubmit = () => {
		const text = input.trim();
		if (!text || !activeId || session.busy) return;
		setInput("");
		void session.sendMessage(text);
	};

	const previewEntries = Object.entries(session.previews);

	return (
		<Shell
			panel={
				<Panel
					label="Sessions"
					description={
						<PanelGuide
							steps={[
								"Sessions are durable: the sandbox, files, and conversation survive between visits — pick one up where it stopped.",
								"Bash runs only with your approval; the card pauses the session until you allow or deny.",
								"Define an outcome to make the agent iterate against a rubric; deliverables land in the files list below.",
							]}
						/>
					}
					banner={
						<Button
							className="w-full shadow-[0_2px_20px_-4px_rgb(0_0_0/0.08),0_0_40px_-8px_rgb(0_0_0/0.04)]"
							onClick={onCreate}
							disabled={creating}
							data-testid="chat-new"
						>
							<HugeiconsIcon icon={Add01Icon} size={14} data-icon="inline-start" />
							New session
						</Button>
					}
				>
					{sessions.length > 0 && (
						<PanelList>
							{sessions.map((s) => (
								<button
									key={s.id}
									type="button"
									className="w-full text-left"
									data-testid="session-item"
									onClick={() => onSelect(s.id)}
								>
									<PanelItem
										title={s.title ?? s.id}
										subtitle={s.created_at ? new Date(s.created_at).toLocaleString() : undefined}
										badgeLabel={s.status}
										isActive={s.id === activeId}
									/>
								</button>
							))}
						</PanelList>
					)}
					{session.usage && (
						<>
							<PanelDivider />
							<div className="text-muted-foreground/70 flex flex-col gap-1 px-2.5 font-mono text-[11px]">
								<span>in {session.usage.input_tokens ?? 0} tok</span>
								<span>out {session.usage.output_tokens ?? 0} tok</span>
								<span>cache {session.usage.cache_read_input_tokens ?? 0} tok</span>
							</div>
						</>
					)}
					{files.length > 0 && (
						<>
							<PanelDivider />
							<PanelList>
								{files.map((file) => (
									<PanelItem
										key={file.id}
										title={file.filename ?? file.id}
										icon={
											<a
												href={`/api/agent/sessions/${activeId}/files?file=${file.id}&name=${encodeURIComponent(file.filename ?? "download")}`}
												download
												aria-label={`Download ${file.filename ?? file.id}`}
												className="text-muted-foreground hover:text-foreground"
											>
												<HugeiconsIcon icon={File02Icon} size={14} />
											</a>
										}
									/>
								))}
							</PanelList>
						</>
					)}
				</Panel>
			}
		>
			<div data-testid="chat-surface" className="relative flex h-svh flex-col">
				<div className="from-background via-background pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b to-transparent lg:hidden" />

				<ChatMessages>
					{!activeId || session.events.length === 0 ? (
						<MessageScrollerItem className="flex-1">
							<EmptyState
								icon={ArtificialIntelligence03Icon}
								title={project.name}
								subtitle={
									activeId
										? "Connected. Ask for something real — running a command shows the approval card."
										: project.tagline
								}
							/>
							{!activeId && (
								<div className="flex justify-center pt-4">
									<Button onClick={onCreate} disabled={creating} data-testid="chat-start">
										<HugeiconsIcon icon={Add01Icon} size={14} data-icon="inline-start" />
										Start a session
									</Button>
								</div>
							)}
						</MessageScrollerItem>
					) : (
						session.events.map((event, index) => {
							const key = event.id ?? `${event.type}-${index}`;
							const row = renderEvent(event, {
								resultIndex,
								approvalsByEventId,
								canRespond: true,
								onConfirm: session.confirmTool,
							});
							if (!row) return null;
							return (
								<MessageScrollerItem
									key={key}
									messageId={event.id}
									scrollAnchor={event.type === "user.message"}
								>
									{row}
								</MessageScrollerItem>
							);
						})
					)}

					{previewEntries.map(([id, text]) => (
						<MessageScrollerItem key={`preview-${id}`}>
							<PreviewBubble text={text} />
						</MessageScrollerItem>
					))}

					{session.busy && previewEntries.length === 0 && (
						<MessageScrollerItem>
							<Marker role="status">
								<MarkerIcon>
									<Spinner className="size-3.5" />
								</MarkerIcon>
								<MarkerContent>Working…</MarkerContent>
							</Marker>
						</MessageScrollerItem>
					)}

					{session.connectionError && (
						<MessageScrollerItem>
							<SessionErrorEvent
								event={{ type: "app.stream_error", error: { message: session.connectionError } }}
							/>
						</MessageScrollerItem>
					)}
				</ChatMessages>

				<div className="flex flex-col gap-2 px-4 pb-4">
					{activeId && (
						<div className="flex justify-end">
							<OutcomeDialog
								disabled={session.busy}
								onDefine={(description, rubric, maxIterations) =>
									void session.defineOutcome(description, rubric, maxIterations)
								}
							/>
						</div>
					)}
					<ChatInput
						value={input}
						onChange={setInput}
						onSubmit={handleSubmit}
						onStop={() => void session.interrupt()}
						isLoading={session.busy}
						placeholder={activeId ? "Ask the agent…" : "Start a session first"}
					/>
				</div>
			</div>
		</Shell>
	);
}

function renderEvent(
	event: Parameters<typeof UserEvent>[0]["event"],
	context: {
		resultIndex: ReturnType<typeof buildResultIndex>;
		approvalsByEventId: Map<
			string,
			{ eventId: string; name: string; input: Record<string, unknown> }
		>;
		canRespond: boolean;
		onConfirm: (eventId: string, decision: "allow" | "deny") => Promise<void>;
	},
) {
	switch (event.type) {
		case "user.message":
			return <UserEvent event={event} />;
		case "agent.message":
			return <AgentMessageEvent event={event} />;
		case "agent.thinking":
			return <ThinkingEvent event={event} />;
		case "agent.tool_use":
		case "agent.mcp_tool_use":
		case "agent.custom_tool_use":
			return (
				<ToolEventCard
					event={event}
					result={event.id ? context.resultIndex.get(event.id) : undefined}
					approval={event.id ? context.approvalsByEventId.get(event.id) : undefined}
					canRespond={context.canRespond}
					onConfirm={context.onConfirm}
				/>
			);
		case "session.thread_created":
		case "agent.thread_message_sent":
		case "agent.thread_message_received":
			return <ThreadMarker event={event} />;
		case "span.outcome_evaluation_start":
		case "span.outcome_evaluation_end":
			return <OutcomeEvent event={event} />;
		case "session.error":
			return <SessionErrorEvent event={event} />;
		default:
			return null;
	}
}

function OutcomeDialog({
	disabled,
	onDefine,
}: {
	disabled: boolean;
	onDefine: (description: string, rubric: string, maxIterations: number) => void;
}) {
	const [open, setOpen] = useState(false);
	const [description, setDescription] = useState("");
	const [rubric, setRubric] = useState(DEFAULT_RUBRIC);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button variant="ghost" size="sm" disabled={disabled} data-testid="outcome-open">
						Define outcome
					</Button>
				}
			/>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Define an outcome</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="outcome-description">What should exist when this is done?</Label>
						<Textarea
							id="outcome-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="e.g. A one-page competitive brief on X as markdown"
							rows={2}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="outcome-rubric">Rubric — explicit, gradeable criteria</Label>
						<Textarea
							id="outcome-rubric"
							value={rubric}
							onChange={(e) => setRubric(e.target.value)}
							rows={8}
							className="font-mono text-xs"
						/>
					</div>
					<p className="text-muted-foreground/70 text-xs">
						A separate grader evaluates each iteration against the rubric (up to 5 rounds) and feeds
						its findings back to the agent. Iterations bill like normal turns.
					</p>
				</div>
				<DialogFooter>
					<Button
						disabled={!description.trim() || !rubric.trim()}
						onClick={() => {
							onDefine(description.trim(), rubric, 5);
							setOpen(false);
							setDescription("");
						}}
					>
						Start
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
