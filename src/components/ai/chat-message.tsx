"use client";

import { Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { isFileUIPart, isReasoningUIPart, isTextUIPart, type UIMessage } from "ai";
import { useCallback, useState } from "react";
import { ImageFrame } from "@/components/ai/image-frame";
import { Markdown } from "@/components/ai/markdown";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Message, MessageContent, MessageFooter } from "@/components/ui/message";

// ─── User message ────────────────────────────────────────────────────────────

export function UserMessage({ message }: { message: UIMessage }) {
	const fullText = message.parts
		.filter(isTextUIPart)
		.map((p) => p.text)
		.join("\n");

	const [copied, setCopied] = useState(false);
	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(fullText);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [fullText]);

	if (!fullText) return null;

	return (
		<Message align="end" className="fade-in animate-in duration-200">
			<MessageContent>
				<Bubble align="end">
					<BubbleContent className="text-base whitespace-pre-wrap">{fullText}</BubbleContent>
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

// ─── Assistant message ───────────────────────────────────────────────────────

/**
 * Renders an assistant message by mapping over its parts:
 *   text → ghost Bubble + Streamdown markdown (Typeset chat rhythm),
 *   file(image/*) → in-column ImageFrame,
 *   reasoning → a muted collapsible-free block.
 */
export function AssistantMessage({
	message,
	isStreaming,
}: {
	message: UIMessage;
	isStreaming: boolean;
}) {
	return (
		<Message className="fade-in animate-in duration-200">
			<MessageContent className="gap-3">
				{message.parts.map((part, i) => {
					const key = `${message.id}-${i}`;

					if (isTextUIPart(part) && part.text) {
						return (
							<Bubble key={key} variant="ghost">
								<BubbleContent>
									<Markdown text={part.text} isStreaming={isStreaming} />
								</BubbleContent>
							</Bubble>
						);
					}

					if (isReasoningUIPart(part) && part.text) {
						return (
							<div
								key={key}
								className="text-muted-foreground/70 border-border border-l-2 pl-3 text-sm leading-relaxed italic"
							>
								{part.text}
							</div>
						);
					}

					if (isFileUIPart(part) && part.mediaType?.startsWith("image/")) {
						return <ImageFrame key={key} src={part.url} isStreaming={isStreaming} />;
					}

					return null;
				})}
			</MessageContent>
		</Message>
	);
}
