"use client";

import { Add01Icon, ArtificialIntelligence03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEveAgent } from "eve/react";
import { useState } from "react";
import {
	AssistantMessage,
	ChatInput,
	ChatMessages,
	EmptyState,
	UserMessage,
} from "@/components/ai";
import { Panel, PanelGuide } from "@/components/panels/shared";
import { Shell } from "@/components/shell/shell";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { MessageScrollerItem } from "@/components/ui/message-scroller";
import { Spinner } from "@/components/ui/spinner";
import { project } from "@/lib/project";

/**
 * Default demo — the shell hosting a session with the eve agent in `agent/`.
 * The agent runs SERVER-SIDE on the deployment's Vercel AI Gateway: no visitor
 * key, no client model calls. Visitors of a deployed copy talk to that copy's
 * agent; the README leads with one-click "Deploy your own" so each clone bills
 * its own account.
 *
 * To build the next demo: edit `agent/` (instructions, tools, skills,
 * schedules, connections — see PACK docs) + `src/lib/project.ts` (copy) + this
 * page's composition. The shell + kit stay untouched.
 */
export default function Home() {
	// Remounting the conversation subtree starts a fresh session.
	const [sessionEpoch, setSessionEpoch] = useState(0);
	return <AgentSession key={sessionEpoch} onNewSession={() => setSessionEpoch((n) => n + 1)} />;
}

function AgentSession({ onNewSession }: { onNewSession: () => void }) {
	const agent = useEveAgent();
	const [input, setInput] = useState("");

	const isBusy = agent.status === "submitted" || agent.status === "streaming";
	const messages = agent.data.messages;

	const handleSubmit = () => {
		const text = input.trim();
		if (!text || isBusy) return;
		setInput("");
		void agent.send({ message: text });
	};

	const handleNew = () => {
		agent.stop();
		onNewSession();
	};

	return (
		<Shell
			panel={
				<Panel
					label="About this agent"
					description={
						<PanelGuide
							steps={[
								"This agent runs server-side — durable sessions, tools, and schedules on the deployment's Vercel AI Gateway. Nothing to paste.",
								"Ask anything. Tool calls that need a human show Approve / Deny right in the conversation.",
								"Want your own? One-click deploy in the README — your copy runs and bills on YOUR account.",
							]}
						/>
					}
					banner={
						messages.length > 0 ? (
							<Button
								className="w-full shadow-[0_2px_20px_-4px_rgb(0_0_0/0.08),0_0_40px_-8px_rgb(0_0_0/0.04)]"
								onClick={handleNew}
								data-testid="chat-new"
							>
								<HugeiconsIcon icon={Add01Icon} size={14} data-icon="inline-start" />
								New session
							</Button>
						) : undefined
					}
				/>
			}
		>
			<div data-testid="chat-surface" className="relative flex h-svh flex-col">
				{/* Mobile top scrim — a gradient mask so the floating logo + New sit over a clean strip */}
				<div className="from-background via-background pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b to-transparent lg:hidden" />

				{messages.length > 0 && (
					<button
						type="button"
						onClick={handleNew}
						data-testid="chat-new-mobile"
						aria-label="New session"
						className="text-foreground hover:text-muted-foreground absolute right-4 top-3 z-20 flex items-center gap-1.5 py-1.5 text-sm font-medium transition-colors lg:hidden"
					>
						<HugeiconsIcon icon={Add01Icon} size={14} />
						New
					</button>
				)}

				<ChatMessages>
					{messages.length === 0 ? (
						<MessageScrollerItem className="flex-1">
							<EmptyState
								icon={ArtificialIntelligence03Icon}
								title={project.name}
								subtitle={project.tagline}
							/>
						</MessageScrollerItem>
					) : (
						messages.map((message, index) => (
							<MessageScrollerItem
								key={message.id}
								messageId={message.id}
								scrollAnchor={message.role === "user"}
							>
								{message.role === "user" ? (
									<UserMessage message={message} />
								) : (
									<AssistantMessage
										message={message}
										isStreaming={agent.status === "streaming" && index === messages.length - 1}
										canRespond={!isBusy}
										onInputResponses={(inputResponses) => agent.send({ inputResponses })}
									/>
								)}
							</MessageScrollerItem>
						))
					)}

					{agent.status === "submitted" && (
						<MessageScrollerItem>
							<Marker role="status">
								<MarkerIcon>
									<Spinner className="size-3.5" />
								</MarkerIcon>
								<MarkerContent>Working…</MarkerContent>
							</Marker>
						</MessageScrollerItem>
					)}

					{agent.error && (
						<MessageScrollerItem>
							<Bubble variant="destructive">
								<BubbleContent data-testid="chat-error" className="text-xs">
									{agent.error.message}
								</BubbleContent>
							</Bubble>
						</MessageScrollerItem>
					)}
				</ChatMessages>

				<div className="px-4 pb-4">
					<ChatInput
						value={input}
						onChange={setInput}
						onSubmit={handleSubmit}
						onStop={agent.stop}
						isLoading={isBusy}
						placeholder="Ask the agent…"
					/>
				</div>
			</div>
		</Shell>
	);
}
