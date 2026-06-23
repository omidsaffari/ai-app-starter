"use client";

import { useChat } from "@ai-sdk/react";
import { Add01Icon, ArtificialIntelligence03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useRef, useState } from "react";
import {
	AssistantMessage,
	ChatInput,
	EmptyState,
	ModelSelector,
	UserMessage,
} from "@/components/ai";
import { KeyGate } from "@/components/key-gate";
import { Panel, PanelGuide } from "@/components/panels/shared";
import { Shell } from "@/components/shell/shell";
import { Button } from "@/components/ui/button";
import { PROVIDER_KEY_HEADER, readKey, useByokKey } from "@/lib/byok";
import { DEFAULT_MODEL_ID, providerOf } from "@/lib/models";

/**
 * Default demo — the shell hosting a working BYOK chat + image conversation.
 * Key-gate lives in the panel; the conversation + composer own the main column.
 *
 * The visitor picks a model (any provider in `lib/models.ts`); the key-gate is
 * scoped to that model's provider, and `useChat` streams over a transport that
 * attaches the matching sessionStorage key as the `x-provider-key` header plus
 * the selected `modelId` in the body, fresh per request (never closed over), so
 * switching models or clearing the key takes effect at once.
 *
 * To build the next demo: edit `src/lib/models.ts` (which models) +
 * `src/lib/capability.ts` (the model call) + `src/lib/project.ts` (copy). The
 * shell + BYOK core stay untouched.
 */
export default function Home() {
	const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
	const provider = providerOf(modelId);
	const { key, setKey, clear, hasKey } = useByokKey(provider);
	const [input, setInput] = useState("");

	// Keep the latest provider/model for the transport, which reads them fresh
	// per request (never closes over stale values).
	const providerRef = useRef(provider);
	providerRef.current = provider;
	const modelRef = useRef(modelId);
	modelRef.current = modelId;

	// Transport: same-origin `/api/run`. The header carries the selected
	// provider's key (pulled fresh from sessionStorage); the body carries the
	// selected modelId so the route builds the right provider client.
	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: "/api/run",
				headers: () => ({ [PROVIDER_KEY_HEADER]: readKey(providerRef.current) }),
				body: () => ({ modelId: modelRef.current }),
			}),
		[],
	);

	const { messages, sendMessage, setMessages, status, stop, error } = useChat({ transport });
	const isLoading = status === "submitted" || status === "streaming";

	const handleSubmit = () => {
		const text = input.trim();
		if (!text || isLoading || !hasKey) return;
		setInput("");
		sendMessage({ text });
	};

	// Reset the conversation back to the empty state (keeps the key set).
	const handleNew = () => {
		stop();
		setMessages([]);
		setInput("");
	};

	return (
		<Shell
			panel={
				<Panel
					label="Get started"
					description={
						<PanelGuide
							steps={[
								"Paste your provider key — it stays in your browser and is only sent to the model.",
								"Pick a model, then describe what you want.",
								"Get your result — streamed text or an image, right here.",
							]}
						/>
					}
					banner={
						<div className="flex flex-col gap-2.5">
							{messages.length > 0 && (
								<Button
									className="w-full shadow-[0_2px_20px_-4px_rgb(0_0_0/0.08),0_0_40px_-8px_rgb(0_0_0/0.04)]"
									onClick={handleNew}
									data-testid="chat-new"
								>
									<HugeiconsIcon icon={Add01Icon} size={14} data-icon="inline-start" />
									New chat
								</Button>
							)}
							<KeyGate
								provider={provider}
								value={key}
								hasKey={hasKey}
								onSet={setKey}
								onClear={clear}
							/>
						</div>
					}
				/>
			}
		>
			<div data-testid="chat-surface" className="relative flex h-svh flex-col">
				{/* New — mobile only (desktop has it in the panel); secondary, top-right */}
				{messages.length > 0 && (
					<div className="absolute right-3 top-3 z-20 lg:hidden">
						<Button
							variant="secondary"
							size="sm"
							onClick={handleNew}
							data-testid="chat-new-mobile"
							aria-label="New conversation"
						>
							<HugeiconsIcon icon={Add01Icon} size={14} data-icon="inline-start" />
							New
						</Button>
					</div>
				)}

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
					>
						<ModelSelector model={modelId} setModel={setModelId} />
					</ChatInput>
				</div>
			</div>
		</Shell>
	);
}
