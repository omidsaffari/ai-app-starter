"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type React from "react";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";

/**
 * Scrollable message column with auto-scroll + a scroll-to-bottom button.
 * Ported from dvnc-cloud. Messages come in as `children` (stable element
 * references owned by the parent), so the scroll hook's `setState` only
 * re-renders THIS component and never reconciles the messages — which is what
 * stops the MutationObserver → setState render loop.
 */
export function ChatMessages({ children }: { children: React.ReactNode }) {
	const { containerRef, endRef, isAtBottom, scrollToBottom } = useScrollToBottom();

	return (
		<div className="relative flex-1">
			<div
				ref={containerRef}
				className="absolute inset-0 touch-pan-y overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				<div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-4 pt-20 pb-6 lg:pt-8">
					{children}
					<div ref={endRef} className="min-h-[1px] shrink-0" />
				</div>
			</div>

			<button
				type="button"
				aria-label="Scroll to bottom"
				onClick={() => scrollToBottom("smooth")}
				className={`bg-background hover:bg-muted border-border absolute bottom-4 left-1/2 z-10 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border shadow-lg transition-all ${
					isAtBottom ? "pointer-events-none scale-0 opacity-0" : "scale-100 opacity-100"
				}`}
			>
				<HugeiconsIcon icon={ArrowDown01Icon} size={16} />
			</button>
		</div>
	);
}
