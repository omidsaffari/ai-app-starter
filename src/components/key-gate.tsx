"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { project } from "@/lib/project";

/**
 * The BYOK key input. The key is masked (type=password), never rendered back as
 * text, and once set only its length is shown. Storage + transport live in
 * `lib/byok.ts`; this component is presentation only. Stable `data-testid`
 * hooks (`byok-input`, `byok-set`, `byok-clear`) anchor the no-leak test.
 */
export function KeyGate({
	value,
	hasKey,
	onSet,
	onClear,
}: {
	value: string;
	hasKey: boolean;
	onSet: (k: string) => void;
	onClear: () => void;
}) {
	const [draft, setDraft] = useState("");

	if (hasKey) {
		return (
			<div className="border-border bg-card flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
				<span className="text-muted-foreground" data-testid="byok-status">
					Key set for this session · {value.length} chars · masked
				</span>
				<Button variant="ghost" size="sm" onClick={onClear} data-testid="byok-clear">
					Clear
				</Button>
			</div>
		);
	}

	return (
		<div className="border-border bg-card rounded-xl border p-4">
			<label className="text-muted-foreground block text-sm" htmlFor="byok">
				{project.provider.label}
			</label>
			<div className="mt-2 flex gap-2">
				<input
					id="byok"
					data-testid="byok-input"
					type="password"
					autoComplete="off"
					aria-label="API key"
					className="border-border bg-background text-foreground focus:border-ring min-w-0 flex-1 rounded-lg border p-2 outline-none"
					placeholder={project.provider.placeholder}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
				/>
				<Button
					data-testid="byok-set"
					disabled={!draft.trim()}
					onClick={() => {
						if (draft.trim()) onSet(draft.trim());
						setDraft("");
					}}
				>
					Set
				</Button>
			</div>
			<p className="text-muted-foreground/70 mt-2 text-xs">{project.provider.help}</p>
		</div>
	);
}
