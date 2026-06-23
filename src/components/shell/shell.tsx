"use client";

import { type ReactNode, useEffect, useState } from "react";
import { BrandMark } from "@/components/shell/brand-mark";
import { IconStrip } from "@/components/shell/icon-strip";
import { SectionPanel } from "@/components/shell/panel";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { project } from "@/lib/project";
import { cn } from "@/lib/utils";

/**
 * Shell — the simplified Labs dashboard layout.
 *
 * ┌────────┬─────────────────┬──────────────────────────────┐
 * │ rail   │ panel           │ main (centered min(1200px),   │
 * │ (48px) │ (360px,         │       dashed left divider)    │
 * │ logo + │  collapsible)   │                               │
 * │ toggle │                 │                               │
 * └────────┴─────────────────┴──────────────────────────────┘
 *
 * One rail, one panel, one main. The panel collapses (width + opacity slide)
 * via the rail/header toggles or ⌘B. On mobile the rail + panel fold into a
 * hamburger Sheet. No org switcher, multi-route panels, or auth — those are
 * dvnc-cloud product concerns the starter drops.
 */
export function Shell({ panel, children }: { panel?: ReactNode; children: ReactNode }) {
	const [open, setOpen] = useState(true);
	const toggle = () => setOpen((v) => !v);

	// ⌘B / Ctrl+B toggles the panel.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((v) => !v);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return (
		<div className="flex h-svh w-full min-w-0">
			{/* Desktop: rail + collapsible panel */}
			<aside className="bg-sidebar hidden h-full shrink-0 overflow-hidden lg:flex">
				<IconStrip open={open} onToggle={toggle} />
				<div
					className={cn(
						"h-full overflow-hidden transition-[width] duration-200 ease-out",
						open ? "w-[360px]" : "w-0 delay-100",
					)}
				>
					<div
						className={cn(
							"h-full transition-opacity duration-200 ease-out",
							open ? "opacity-100 delay-100" : "opacity-0",
						)}
					>
						<SectionPanel onToggle={toggle}>{panel}</SectionPanel>
					</div>
				</div>
			</aside>

			{/* Mobile: logo + name is the trigger that opens the panel Sheet */}
			<div className="absolute left-4 top-3 z-30 lg:hidden">
				<Sheet>
					<SheetTrigger
						render={
							<button
								type="button"
								aria-label="Open menu"
								className="text-foreground hover:text-muted-foreground flex items-center gap-2 py-1.5 transition-colors"
							/>
						}
					>
						<BrandMark className="size-5" />
						<span className="text-sm font-medium">{project.name}</span>
					</SheetTrigger>
					<SheetContent side="left" className="w-[360px] max-w-[90vw] p-0">
						<SheetTitle className="px-5 pt-4">{project.name}</SheetTitle>
						<div className="flex-1 overflow-y-auto px-3 pb-4">{panel ?? null}</div>
					</SheetContent>
				</Sheet>
			</div>

			{/* Main column — centered min(1200px), dashed left divider */}
			<div className="flex min-h-0 min-w-0 flex-1 flex-col lg:border-l lg:border-dashed">
				<main className="bg-background relative flex flex-1 flex-col overflow-y-auto overscroll-y-none">
					<div className="animate-page-reveal grid flex-1 content-start grid-cols-[1fr_min(1200px,100%)_1fr] *:col-2 lg:grid-cols-[1fr_min(1200px,calc(100%-2.5rem))_1fr]">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
