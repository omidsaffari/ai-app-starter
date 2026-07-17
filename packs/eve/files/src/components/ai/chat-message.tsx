"use client";

import {
	ArrowDown01Icon,
	CheckmarkCircle02Icon,
	Copy01Icon,
	File02Icon,
	Key01Icon,
	LinkSquare01Icon,
	Tick01Icon,
	Wrench01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type {
	EveAuthorizationPart,
	EveDynamicToolPart,
	EveMessage,
	EveMessagePart,
} from "eve/react";
import { useCallback, useState } from "react";
import { Markdown } from "@/components/ai/markdown";
import {
	Attachment,
	AttachmentContent,
	AttachmentDescription,
	AttachmentMedia,
	AttachmentTitle,
	AttachmentTrigger,
} from "@/components/ui/attachment";
import { Badge } from "@/components/ui/badge";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Kbd } from "@/components/ui/kbd";
import { Message, MessageContent, MessageFooter } from "@/components/ui/message";

export type InputResponse = {
	readonly requestId: string;
	readonly optionId?: string;
	readonly text?: string;
};

type EveFilePart = Extract<EveMessagePart, { type: "file" }>;

// ─── User message ────────────────────────────────────────────────────────────

export function UserMessage({ message }: { message: EveMessage }) {
	const fullText = message.parts
		.filter((p): p is Extract<EveMessagePart, { type: "text" }> => p.type === "text")
		.map((p) => p.text)
		.join("\n");
	const files = message.parts.filter((p): p is EveFilePart => p.type === "file");

	const [copied, setCopied] = useState(false);
	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(fullText);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [fullText]);

	if (!fullText && files.length === 0) return null;

	return (
		<Message align="end" className="fade-in animate-in duration-200">
			<MessageContent>
				{files.map((file, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: eve file parts carry no id
					<FileAttachment key={`${message.id}-file-${i}`} part={file} />
				))}
				{fullText && (
					<Bubble align="end">
						<BubbleContent className="text-base whitespace-pre-wrap">{fullText}</BubbleContent>
					</Bubble>
				)}
				{fullText && (
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
				)}
			</MessageContent>
		</Message>
	);
}

// ─── Assistant message ───────────────────────────────────────────────────────

/**
 * Renders an assistant EveMessage by mapping over its parts:
 *   text → ghost Bubble + Streamdown markdown (Typeset chat rhythm),
 *   reasoning → muted block, file → Attachment card,
 *   authorization → connection sign-in card,
 *   dynamic-tool → collapsible tool card with HITL approval buttons.
 */
export function AssistantMessage({
	message,
	isStreaming,
	canRespond,
	onInputResponses,
}: {
	message: EveMessage;
	isStreaming: boolean;
	canRespond: boolean;
	onInputResponses: (responses: readonly InputResponse[]) => void | Promise<void>;
}) {
	const lastTextIndex = message.parts.reduce(
		(last, part, index) => (part.type === "text" ? index : last),
		-1,
	);

	return (
		<Message className="fade-in animate-in duration-200">
			<MessageContent className="gap-3">
				{message.parts.map((part, index) => {
					const key = partKey(message.id, part, index);

					if (part.type === "text" && part.text) {
						return (
							<Bubble key={key} variant="ghost">
								<BubbleContent>
									<Markdown text={part.text} isStreaming={isStreaming && index === lastTextIndex} />
								</BubbleContent>
							</Bubble>
						);
					}

					if (part.type === "reasoning" && part.text) {
						return (
							<div
								key={key}
								className="text-muted-foreground/70 border-border border-l-2 pl-3 text-sm leading-relaxed italic"
							>
								{part.text}
							</div>
						);
					}

					if (part.type === "file") {
						return <FileAttachment key={key} part={part} />;
					}

					if (part.type === "authorization") {
						return <AuthorizationCard key={key} part={part} />;
					}

					if (part.type === "dynamic-tool") {
						return (
							<ToolCard
								key={key}
								part={part}
								canRespond={canRespond}
								onInputResponses={onInputResponses}
							/>
						);
					}

					return null;
				})}
			</MessageContent>
		</Message>
	);
}

// ─── File part → Attachment card ─────────────────────────────────────────────

function FileAttachment({ part }: { part: EveFilePart }) {
	const label = part.filename ?? "Attachment";
	const detail = [part.mediaType, formatBytes(part.size)].filter(Boolean).join(" · ");
	const isImage = part.mediaType.startsWith("image/") && part.url !== undefined;

	return (
		<Attachment className="w-fit max-w-sm">
			<AttachmentMedia variant={isImage ? "image" : "icon"}>
				{isImage ? (
					// biome-ignore lint/performance/noImgElement: arbitrary session-scoped URL — next/image adds nothing here
					<img src={part.url} alt={label} />
				) : (
					<HugeiconsIcon icon={File02Icon} size={16} />
				)}
			</AttachmentMedia>
			<AttachmentContent>
				<AttachmentTitle>{label}</AttachmentTitle>
				{detail && <AttachmentDescription>{detail}</AttachmentDescription>}
			</AttachmentContent>
			{part.url && (
				<AttachmentTrigger
					render={
						// biome-ignore lint/a11y/useAnchorContent: full-card overlay anchor — the aria-label IS the accessible name
						<a href={part.url} target="_blank" rel="noreferrer" aria-label={`Open ${label}`} />
					}
				/>
			)}
		</Attachment>
	);
}

// ─── Authorization part → connection sign-in card ────────────────────────────

function AuthorizationCard({ part }: { part: EveAuthorizationPart }) {
	const isAuthorized = part.state === "completed" && part.outcome === "authorized";
	const isCompleted = part.state === "completed";
	const instructions = part.authorization?.instructions;

	return (
		<div className="border-border bg-muted/50 flex w-fit max-w-md flex-col gap-3 rounded-lg border p-4">
			<div className="flex items-start gap-3">
				<span
					className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
						isAuthorized
							? "bg-foreground/10 text-foreground"
							: isCompleted
								? "bg-destructive/10 text-destructive"
								: "bg-(--brand)/10 text-(--brand)"
					}`}
				>
					<HugeiconsIcon icon={isAuthorized ? CheckmarkCircle02Icon : Key01Icon} size={16} />
				</span>
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<span className="text-sm font-medium">
						{part.state === "required"
							? `Connect ${part.displayName}`
							: isAuthorized
								? `${part.displayName} connected`
								: `${part.displayName} authorization ${part.outcome ?? "pending"}`}
					</span>
					<span className="text-muted-foreground text-xs leading-relaxed">
						{part.state === "required" ? part.description : (part.reason ?? "")}
					</span>
					{instructions && instructions !== part.description && (
						<span className="text-muted-foreground/70 text-xs leading-relaxed">{instructions}</span>
					)}
				</div>
			</div>
			{part.state === "required" && part.authorization?.userCode && (
				<div className="text-muted-foreground flex items-center gap-2 text-xs">
					Code <Kbd>{part.authorization.userCode}</Kbd>
				</div>
			)}
			{part.state === "required" && part.authorization?.url && (
				<Button
					size="sm"
					className="w-fit"
					render={
						<a href={part.authorization.url} target="_blank" rel="noreferrer">
							<HugeiconsIcon icon={LinkSquare01Icon} size={14} data-icon="inline-start" />
							Sign in with {part.displayName}
						</a>
					}
				/>
			)}
		</div>
	);
}

// ─── Dynamic-tool part → collapsible tool card + HITL approvals ──────────────

function ToolCard({
	part,
	canRespond,
	onInputResponses,
}: {
	part: EveDynamicToolPart;
	canRespond: boolean;
	onInputResponses: (responses: readonly InputResponse[]) => void | Promise<void>;
}) {
	const needsApproval = part.state === "approval-requested" || part.state === "approval-responded";
	const inputRequest = part.toolMetadata?.eve?.inputRequest;
	const inputResponse = part.toolMetadata?.eve?.inputResponse;
	const selectedOption = inputRequest?.options?.find((o) => o.id === inputResponse?.optionId);

	return (
		<Collapsible
			defaultOpen={needsApproval}
			className="border-border w-full max-w-md rounded-lg border"
		>
			<CollapsibleTrigger className="group/tool hover:bg-muted/50 flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors">
				<HugeiconsIcon icon={Wrench01Icon} size={14} className="text-muted-foreground shrink-0" />
				<span className="min-w-0 flex-1 truncate text-left font-mono text-xs">{part.toolName}</span>
				<Badge variant={part.state === "output-error" ? "destructive" : "secondary"}>
					{part.state}
				</Badge>
				<HugeiconsIcon
					icon={ArrowDown01Icon}
					size={14}
					className="text-muted-foreground/50 shrink-0 transition-transform group-data-[panel-open]/tool:rotate-180"
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className="flex flex-col gap-2 px-3 pb-3">
				{part.input !== undefined && <JsonBlock label="Input" value={part.input} />}
				{inputRequest && (
					<div className="border-border bg-muted/50 flex flex-col gap-2 rounded-lg border p-3">
						<span className="text-muted-foreground text-xs leading-relaxed">
							{inputRequest.prompt}
						</span>
						{inputResponse ? (
							<span className="text-sm font-medium">
								Responded: {selectedOption?.label ?? inputResponse.text ?? inputResponse.optionId}
							</span>
						) : (
							<div className="flex flex-wrap gap-2">
								{inputRequest.options?.map((option) => (
									<Button
										key={option.id}
										size="sm"
										disabled={!canRespond}
										variant={option.style === "danger" ? "destructive" : "default"}
										onClick={() => {
											void onInputResponses([
												{ requestId: inputRequest.requestId, optionId: option.id },
											]);
										}}
									>
										{option.label}
									</Button>
								))}
							</div>
						)}
					</div>
				)}
				{part.errorText ? (
					<div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-xs">
						{part.errorText}
					</div>
				) : (
					part.output !== undefined && <JsonBlock label="Output" value={part.output} />
				)}
			</CollapsibleContent>
		</Collapsible>
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

function formatBytes(size: number | undefined): string | undefined {
	if (size === undefined) return undefined;
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function partKey(messageId: string, part: EveMessagePart, index: number): string {
	if (part.type === "authorization") {
		return `${messageId}-auth-${part.turnId}-${part.stepIndex}-${part.name}`;
	}
	if (part.type === "dynamic-tool") {
		return part.toolCallId;
	}
	return `${messageId}-${part.type}-${index}`;
}
