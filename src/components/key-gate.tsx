"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Provider } from "@/lib/models";
import { PROVIDER_COPY } from "@/lib/project";

/**
 * The BYOK key input — a quiet inline form that belongs to the panel.
 * Provider-aware: label + placeholder + storage slot follow the selected model's
 * provider.
 *
 * The action button floats INSIDE the field, pinned right (Set when empty, Clear
 * once set). FIXED FOOTPRINT: empty and "key set" states share one structure — a
 * label, a single `h-10` field, and a constant helper line — and swap only the
 * field's contents + the inside button. Both buttons share `min-w-14` and the
 * same right inset, so nothing shifts on set/clear.
 *
 * Masked (type=password), never rendered back as text; once set, only its length
 * shows. Storage + transport live in `lib/byok.ts`. Stable testids
 * (`byok-input`, `byok-set`, `byok-clear`, `byok-status`) anchor the no-leak test.
 */
export function KeyGate({
	provider,
	value,
	hasKey,
	onSet,
	onClear,
}: {
	provider: Provider;
	value: string;
	hasKey: boolean;
	onSet: (k: string) => void;
	onClear: () => void;
}) {
	const [draft, setDraft] = useState("");
	const copy = PROVIDER_COPY[provider];

	const submit = () => {
		const trimmed = draft.trim();
		if (trimmed) onSet(trimmed);
		setDraft("");
	};

	return (
		<Field>
			<Label htmlFor="byok">{copy.label}</Label>

			{/* Fixed-height field; the action button floats inside, pinned right. */}
			<div className="relative h-10">
				{hasKey ? (
					<div
						data-testid="byok-status"
						className="bg-secondary text-muted-foreground flex h-10 w-full items-center gap-2 rounded-lg pl-3 pr-[4.5rem] text-[13px]"
					>
						<span className="bg-emerald-500 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
						<span className="truncate">Key set · {value.length} chars · masked</span>
					</div>
				) : (
					<Input
						id="byok"
						data-testid="byok-input"
						type="password"
						autoComplete="off"
						aria-label="API key"
						placeholder={copy.placeholder}
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								submit();
							}
						}}
						className="h-10 w-full pr-[4.5rem]"
					/>
				)}

				{hasKey ? (
					<Button
						data-testid="byok-clear"
						size="sm"
						variant="ghost"
						className="text-muted-foreground hover:text-foreground absolute right-1.5 top-1/2 min-w-14 -translate-y-1/2"
						onClick={onClear}
					>
						Clear
					</Button>
				) : (
					<Button
						data-testid="byok-set"
						size="sm"
						className="absolute right-1.5 top-1/2 min-w-14 -translate-y-1/2"
						disabled={!draft.trim()}
						onClick={submit}
					>
						Set
					</Button>
				)}
			</div>

			<p className="text-muted-foreground/70 text-xs leading-relaxed">
				Used only for this request — never stored or logged. Stays in this browser session.
			</p>
		</Field>
	);
}
