"use client";

import { SidebarLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { project } from "@/lib/project";

/**
 * Block 2 — Section panel (360px, desktop only).
 *
 * Header with the project name + a collapse control; a scrollable body fed by
 * the `children` slot. Each demo decides what lives here (the default page puts
 * its key-gate + intro). Simplified from dvnc-cloud: no org switcher, no
 * per-route panel map — one panel, content via props.
 */
export function SectionPanel({
	onToggle,
	children,
}: {
	onToggle: () => void;
	children?: ReactNode;
}) {
	return (
		<div className="bg-sidebar flex w-[360px] shrink-0 flex-col">
			<div className="flex h-14 shrink-0 items-center justify-between gap-2 px-3">
				<span className="truncate text-[13px] font-medium">{project.name}</span>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={onToggle}
								aria-label="Collapse panel"
							/>
						}
					>
						<HugeiconsIcon icon={SidebarLeftIcon} size={16} />
					</TooltipTrigger>
					<TooltipContent side="bottom">Collapse panel (⌘B)</TooltipContent>
				</Tooltip>
			</div>
			<div className="flex-1 overflow-y-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				{children ?? <DefaultPanelBody />}
			</div>
		</div>
	);
}

function DefaultPanelBody() {
	return (
		<div className="space-y-3 text-sm">
			<p className="text-muted-foreground leading-relaxed">{project.tagline}</p>
			<p className="text-muted-foreground/70 text-xs leading-relaxed">
				Bring your own key. It lives in this browser session only, rides each request server-side,
				and is never stored or logged.
			</p>
		</div>
	);
}
