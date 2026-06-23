"use client";

import { Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { isFileUIPart, isReasoningUIPart, isTextUIPart, type UIMessage } from "ai";
import { useCallback, useState } from "react";
import { ImageFrame } from "@/components/ai/image-frame";
import { Markdown } from "@/components/ai/markdown";

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
		<div className="group/message fade-in animate-in w-full duration-200">
			<div className="flex w-full items-start justify-end gap-2">
				<button
					type="button"
					onClick={handleCopy}
					className="text-muted-foreground/50 hover:bg-muted hover:text-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md transition-all sm:opacity-0 sm:group-hover/message:opacity-100"
					title="Copy text"
				>
					<HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} size={12} />
				</button>
				<div className="bg-foreground text-background max-w-full min-w-0 overflow-hidden rounded-2xl rounded-br-sm px-3 py-1.5">
					<div className="wrap-break-word whitespace-pre-wrap">{fullText}</div>
				</div>
			</div>
		</div>
	);
}

// ─── Assistant message ───────────────────────────────────────────────────────

/**
 * Renders an assistant message by mapping over its parts:
 *   text → Streamdown markdown, file(image/*) → in-column ImageFrame,
 *   reasoning → a muted collapsible-free block.
 * Pruned from dvnc-cloud: no google-tools cards, metadata badge, or selection.
 */
export function AssistantMessage({
	message,
	isStreaming,
}: {
	message: UIMessage;
	isStreaming: boolean;
}) {
	return (
		<div className="group/message fade-in animate-in w-full duration-200">
			<div className="flex w-full flex-col gap-3">
				{message.parts.map((part, i) => {
					const key = `${message.id}-${i}`;

					if (isTextUIPart(part) && part.text) {
						return <Markdown key={key} text={part.text} isStreaming={isStreaming} />;
					}

					if (isReasoningUIPart(part) && part.text) {
						return (
							<div
								key={key}
								className="text-muted-foreground/70 border-border border-l-2 pl-3 text-[13px] leading-relaxed italic"
							>
								{part.text}
							</div>
						);
					}

					if (isFileUIPart(part) && part.mediaType?.startsWith("image/")) {
						return (
							<ImageFrame key={key} src={part.url} isStreaming={isStreaming} />
						);
					}

					return null;
				})}
			</div>
		</div>
	);
}
