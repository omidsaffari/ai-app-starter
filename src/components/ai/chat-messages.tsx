"use client";

import type React from "react";
import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerProvider,
	MessageScrollerViewport,
} from "@/components/ui/message-scroller";

/**
 * The conversation scroll container, on MessageScroller (@shadcn/react):
 * follow-output while the reader is at the live edge, release on any scroll
 * intent, user turns anchor near the top with a peek of the previous turn,
 * history prepends without jumping, and a scroll-to-latest control.
 *
 * Rows come in as children — wrap EVERY direct child in a MessageScrollerItem
 * (from @/components/ui/message-scroller), with `messageId` + `scrollAnchor`
 * on user turns. Scroll state lives outside React (data-* attributes), so
 * streaming never re-renders the transcript rows.
 */
export function ChatMessages({ children }: { children: React.ReactNode }) {
	return (
		<MessageScrollerProvider
			autoScroll
			defaultScrollPosition="last-anchor"
			scrollPreviousItemPeek={64}
		>
			<MessageScroller className="flex-1">
				<MessageScrollerViewport className="touch-pan-y">
					<MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 pt-20 pb-6 lg:pt-8">
						{children}
					</MessageScrollerContent>
				</MessageScrollerViewport>
				<MessageScrollerButton />
			</MessageScroller>
		</MessageScrollerProvider>
	);
}
