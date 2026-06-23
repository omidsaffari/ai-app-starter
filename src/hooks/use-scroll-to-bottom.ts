import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Auto-scroll for chat containers. Ported from dvnc-cloud (Vercel's chatbot
 * reference) — MutationObserver + ResizeObserver for reliable auto-scroll during
 * streaming, with user-scroll detection so it stops following when you scroll up.
 */
export function useScrollToBottom() {
	const containerRef = useRef<HTMLDivElement>(null);
	const endRef = useRef<HTMLDivElement>(null);
	const [isAtBottom, setIsAtBottom] = useState(true);
	const isAtBottomRef = useRef(true);
	const isUserScrollingRef = useRef(false);

	useEffect(() => {
		isAtBottomRef.current = isAtBottom;
	}, [isAtBottom]);

	const checkIfAtBottom = useCallback(() => {
		if (!containerRef.current) return true;
		const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
		return scrollTop + clientHeight >= scrollHeight - 100;
	}, []);

	const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
		if (!containerRef.current) return;
		containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior });
	}, []);

	// User scroll → track whether we're pinned to the bottom.
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		let scrollTimeout: ReturnType<typeof setTimeout>;
		const handleScroll = () => {
			isUserScrollingRef.current = true;
			clearTimeout(scrollTimeout);
			const atBottom = checkIfAtBottom();
			setIsAtBottom(atBottom);
			isAtBottomRef.current = atBottom;
			scrollTimeout = setTimeout(() => {
				isUserScrollingRef.current = false;
			}, 150);
		};
		container.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			container.removeEventListener("scroll", handleScroll);
			clearTimeout(scrollTimeout);
		};
	}, [checkIfAtBottom]);

	// Content changes (new messages, streaming text, images) → follow if pinned.
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const scrollIfNeeded = () => {
			if (isAtBottomRef.current && !isUserScrollingRef.current) {
				requestAnimationFrame(() => {
					container.scrollTo({ top: container.scrollHeight, behavior: "instant" });
					setIsAtBottom(true);
					isAtBottomRef.current = true;
				});
			}
		};
		const mutationObserver = new MutationObserver(scrollIfNeeded);
		mutationObserver.observe(container, { childList: true, subtree: true, characterData: true });
		const resizeObserver = new ResizeObserver(scrollIfNeeded);
		resizeObserver.observe(container);
		for (const child of container.children) {
			resizeObserver.observe(child);
		}
		return () => {
			mutationObserver.disconnect();
			resizeObserver.disconnect();
		};
	}, []);

	return { containerRef, endRef, isAtBottom, scrollToBottom };
}
