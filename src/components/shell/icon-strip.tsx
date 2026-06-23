"use client";

import { Github01Icon, SidebarLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ModeToggle } from "@/components/shell/mode-toggle";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { project } from "@/lib/project";

/**
 * Block 1 — Icon strip (48px rail, desktop only).
 *
 * Logo at top, mode toggle + source link + (when the panel is collapsed) an
 * expand control at the bottom. Simplified from dvnc-cloud: no nav capabilities,
 * no user footer, no org logo — one rail, one purpose.
 */
export function IconStrip({ open, onToggle }: { open: boolean; onToggle: () => void }) {
	return (
		<div className="bg-sidebar relative flex w-12 shrink-0 flex-col items-center">
			{/* While collapsed, the rail background re-opens the panel on a click. */}
			{!open && (
				<button
					type="button"
					tabIndex={-1}
					aria-label="Expand panel"
					onClick={onToggle}
					className="hover:bg-foreground/5 absolute inset-0 z-0 cursor-pointer transition-colors duration-200"
				/>
			)}

			{/* Logo — brand ring, matches the panel header height. */}
			<div className="pointer-events-none relative z-10 flex h-14 shrink-0 items-center justify-center">
				<span className="flex size-6 items-center justify-center rounded-full border-[2.5px] border-(--brand)" />
			</div>

			<div className="flex-1" />

			{/* Footer controls */}
			<div className="relative z-10 flex flex-col items-center gap-1 pb-2">
				{!open && (
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={onToggle}
									aria-label="Expand panel"
								/>
							}
						>
							<HugeiconsIcon icon={SidebarLeftIcon} size={16} />
						</TooltipTrigger>
						<TooltipContent side="right">Expand panel (⌘B)</TooltipContent>
					</Tooltip>
				)}
				<ModeToggle />
				<Tooltip>
					<TooltipTrigger
						render={
							<a
								href={project.repoUrl}
								target="_blank"
								rel="noreferrer"
								className="text-muted-foreground hover:bg-muted/50 hover:text-foreground flex size-8 items-center justify-center rounded-[min(var(--radius-md),10px)] transition-colors"
							>
								<span className="sr-only">Source on GitHub</span>
							</a>
						}
					>
						<HugeiconsIcon icon={Github01Icon} size={16} />
					</TooltipTrigger>
					<TooltipContent side="right">Source</TooltipContent>
				</Tooltip>
			</div>
		</div>
	);
}
