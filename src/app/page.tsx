"use client";

import { useChat } from "@ai-sdk/react";
import { ArtificialIntelligence03Icon } from "@hugeicons/core-free-icons";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { AssistantMessage, ChatInput, EmptyState, UserMessage } from "@/components/ai";
import { KeyGate } from "@/components/key-gate";
import { Shell } from "@/components/shell/shell";
import { PROVIDER_KEY_HEADER, readKey, useByokKey } from "@/lib/byok";
import { project } from "@/lib/project";

/**
 * Default demo — the shell hosting a working BYOK chat + image conversation.
 * Key-gate lives in the panel; the conversation + composer own the main column.
 * `useChat` streams over a transport that attaches the sessionStorage key as the
 * `x-provider-key` header on each same-origin request to `/api/run`. The key is
 * read fresh per request (never closed over), so clearing it takes effect at once.
 *
 * To build the next demo: swap the model call in `src/lib/capability.ts` and the
 * copy in `src/lib/project.ts`. The shell + BYOK core stay untouched.
 */
export default function Home() {
	const { key, setKey, clear, hasKey } = useByokKey();
	const [input, setInput] = useState("");

	// Transport: same-origin `/api/run`, key pulled fresh from sessionStorage
	// per request via the resolvable headers function.
	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: "/api/run",
				headers: () => ({ [PROVIDER_KEY_HEADER]: readKey() }),
			}),
		[],
	);

	const { messages, sendMessage, status, stop, error } = useChat({ transport });
	const isLoading = status === "submitted" || status === "streaming";

	const handleSubmit = () => {
		const text = input.trim();
		if (!text || isLoading || !hasKey) return;
		setInput("");
		sendMessage({ text });
	};

	return (
		<Shell
			panel={
				<div className="space-y-4">
					<div>
						<p className="text-foreground text-sm font-medium">{project.name}</p>
						<p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
							{project.tagline}
						</p>
					</div>
					<KeyGate value={key} hasKey={hasKey} onSet={setKey} onClear={clear} />
				</div>
			}
		>
			<div data-testid="chat-surface" className="flex h-svh flex-col">
				{/* Conversation */}
				<div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
					<div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-4 pt-12 pb-4 lg:pt-6">
						{messages.length === 0 ? (
							<EmptyState
								icon={ArtificialIntelligence03Icon}
								title="Ask anything"
								subtitle={
									hasKey
										? "Chat with text, or ask for an image."
										: "Set your key in the panel to begin."
								}
							/>
						) : (
							messages.map((message, index) =>
								message.role === "user" ? (
									<UserMessage key={message.id} message={message} />
								) : (
									<AssistantMessage
										key={message.id}
										message={message}
										isStreaming={status === "streaming" && index === messages.length - 1}
									/>
								),
							)
						)}

						{status === "submitted" && (
							<div className="text-muted-foreground/50 flex items-center gap-2 text-[13px]">
								<span className="size-1.5 animate-pulse rounded-full bg-current" />
								Working…
							</div>
						)}

						{error && (
							<div
								data-testid="chat-error"
								className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500"
							>
								{error.message}
							</div>
						)}
					</div>
				</div>

				{/* Composer */}
				<div className="px-4 pb-4">
					<ChatInput
						value={input}
						onChange={setInput}
						onSubmit={handleSubmit}
						onStop={stop}
						isLoading={isLoading}
						disabled={!hasKey}
						placeholder={hasKey ? "Ask anything — or ask for an image…" : "Set your key first"}
					/>
				</div>
			</div>
		</Shell>
	);
}
