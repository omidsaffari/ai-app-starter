"use client";

import {
	ArrowExpand01Icon,
	ArrowReloadHorizontalIcon,
	Cancel01Icon,
	Copy01Icon,
	HardDriveDownloadIcon,
	LinkSquare01Icon,
	Loading03Icon,
	SearchAddIcon,
	SearchMinusIcon,
	Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { code } from "@streamdown/code";
import { Streamdown } from "streamdown";

// HugeIcons mapped onto Streamdown's built-in chrome (copy / download / table
// fullscreen / image zoom). The kit ships no lucide-react — Streamdown's default
// icon peer — so we supply every glyph it can reach for.
const ICONS = {
	CopyIcon: () => <HugeiconsIcon icon={Copy01Icon} size={14} />,
	CheckIcon: () => <HugeiconsIcon icon={Tick01Icon} size={14} />,
	DownloadIcon: () => <HugeiconsIcon icon={HardDriveDownloadIcon} size={14} />,
	Maximize2Icon: () => <HugeiconsIcon icon={ArrowExpand01Icon} size={14} />,
	ExternalLinkIcon: () => <HugeiconsIcon icon={LinkSquare01Icon} size={14} />,
	Loader2Icon: () => <HugeiconsIcon icon={Loading03Icon} size={14} className="animate-spin" />,
	RotateCcwIcon: () => <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={14} />,
	XIcon: () => <HugeiconsIcon icon={Cancel01Icon} size={14} />,
	ZoomInIcon: () => <HugeiconsIcon icon={SearchAddIcon} size={14} />,
	ZoomOutIcon: () => <HugeiconsIcon icon={SearchMinusIcon} size={14} />,
};

/**
 * Streamdown markdown renderer — the canonical AI-output renderer. Parses
 * incomplete markdown gracefully while streaming (blurIn animation) and renders
 * finished content statically; typography comes from globals.css ([data-streamdown]).
 */
export function Markdown({ text, isStreaming = false }: { text: string; isStreaming?: boolean }) {
	return (
		<div className="group/text">
			<div className="[&>div>p]:my-4 [&_hr]:my-4 [&_hr]:border-border">
				<Streamdown
					plugins={{ code }}
					icons={ICONS}
					isAnimating={isStreaming}
					animated={isStreaming ? { animation: "blurIn", easing: "ease-in-out" } : false}
					mode={isStreaming ? "streaming" : "static"}
					linkSafety={{ enabled: false }}
					components={{
						a: ({ href, children, ...props }) => (
							<a
								{...props}
								href={href}
								target="_blank"
								rel="noreferrer"
								className="text-muted-foreground hover:text-foreground font-normal transition-colors"
							>
								{children}
							</a>
						),
					}}
				>
					{text}
				</Streamdown>
			</div>
		</div>
	);
}
