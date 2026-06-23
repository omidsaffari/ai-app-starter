"use client";

import { ArrowUp02Icon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type React from "react";

interface ChatInputProps {
	value: string;
	onChange: (value: string) => void;
	onSubmit: () => void;
	onStop: () => void;
	isLoading: boolean;
	disabled?: boolean;
	placeholder?: string;
	/** Slot above textarea — for pending files / hints */
	header?: React.ReactNode;
	/** Slot in bottom bar — for model selector, mode toggle, etc. */
	children?: React.ReactNode;
}

/**
 * Chat input bar with textarea, send/stop button, and a children slot for
 * extras (mode selector, etc.). Lifted from dvnc-cloud; zero exotic deps.
 */
export function ChatInput({
	value,
	onChange,
	onSubmit,
	onStop,
	isLoading,
	disabled,
	placeholder = "Send a message...",
	header,
	children,
}: ChatInputProps) {
	const canSubmit = value.trim().length > 0 && !isLoading && !disabled;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (canSubmit) onSubmit();
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (canSubmit) onSubmit();
		}
	};

	return (
		<div className="sticky bottom-0 z-10 mx-auto flex w-full max-w-3xl gap-2">
			<form
				onSubmit={handleSubmit}
				className="bg-card flex w-full flex-col rounded-2xl shadow-[0_-4px_16px_-4px_rgb(0_0_0/0.1),0_2px_20px_-4px_rgb(0_0_0/0.08)] dark:shadow-[0_-4px_16px_-4px_rgb(0_0_0/0.4),0_2px_20px_-4px_rgb(0_0_0/0.3)]"
			>
				{header}
				<textarea
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					aria-label="Prompt"
					className="text-foreground placeholder:text-muted-foreground/50 max-h-48 min-h-24 w-full resize-none border-0 bg-transparent px-3 py-2.5 text-base leading-relaxed outline-none sm:text-sm"
					rows={1}
					style={{ fieldSizing: "content" } as React.CSSProperties}
					disabled={disabled}
				/>

				<div className="flex items-center gap-1 px-2.5 pb-2">
					{children}
					<div className="flex-1" />
					{isLoading ? (
						<button
							type="button"
							onClick={onStop}
							className="bg-muted text-muted-foreground hover:bg-muted/80 flex size-8 items-center justify-center rounded-lg transition-colors"
							aria-label="Stop"
						>
							<HugeiconsIcon icon={StopIcon} size={18} />
						</button>
					) : (
						<button
							type="submit"
							disabled={!canSubmit}
							className="bg-muted text-muted-foreground hover:bg-muted/80 flex size-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
							aria-label="Send"
						>
							<HugeiconsIcon icon={ArrowUp02Icon} size={18} />
						</button>
					)}
				</div>
			</form>
		</div>
	);
}
