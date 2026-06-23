"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Provider } from "@/lib/models";
import { PROVIDER_COPY } from "@/lib/project";

/**
 * The BYOK key input — a quiet inline form that belongs to the panel, not a
 * stuck-on card. Provider-aware: the label + placeholder follow the currently
 * selected model's provider, and the key is stored under that provider's slot.
 *
 * The key is masked (type=password), never rendered back as text, and once set
 * only its length is shown. Storage + transport live in `lib/byok.ts`; this is
 * presentation only. Stable `data-testid` hooks (`byok-input`, `byok-set`,
 * `byok-clear`) anchor the no-leak test — do not rename them.
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

	if (hasKey) {
		return (
			<div className="flex items-center justify-between gap-2 py-0.5 text-[13px]">
				<span
					className="text-muted-foreground inline-flex items-center gap-2"
					data-testid="byok-status"
				>
					<span className="bg-emerald-500 size-1.5 shrink-0 rounded-full" aria-hidden="true" />
					Key set · {value.length} chars · masked
				</span>
				<button
					type="button"
					onClick={onClear}
					data-testid="byok-clear"
					className="text-muted-foreground/70 hover:text-foreground shrink-0 text-xs underline-offset-4 transition-colors hover:underline"
				>
					Clear
				</button>
			</div>
		);
	}

	const submit = () => {
		const trimmed = draft.trim();
		if (trimmed) onSet(trimmed);
		setDraft("");
	};

	return (
		<Field>
			<Label htmlFor="byok">{copy.label}</Label>
			<div className="flex gap-2">
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
				/>
				<Button data-testid="byok-set" size="lg" disabled={!draft.trim()} onClick={submit}>
					Set
				</Button>
			</div>
			<p className="text-muted-foreground/70 text-xs leading-relaxed">
				Used only for this request — never stored or logged. Stays in this browser session.
			</p>
		</Field>
	);
}
