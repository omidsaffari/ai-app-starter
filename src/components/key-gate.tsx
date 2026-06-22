"use client";

import { useState } from "react";
import { project } from "@/lib/project";

/**
 * The BYOK key input. The key is masked (type=password), never rendered back as
 * text, and once set only its length is shown. Storage + transport live in
 * `lib/byok.ts`; this component is presentation only.
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
			<div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
				<span className="text-muted">Key set for this session · {value.length} chars · masked</span>
				<button type="button" className="text-accent" onClick={onClear}>
					Clear
				</button>
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-border bg-card p-4">
			<label className="block text-muted text-sm" htmlFor="byok">
				{project.provider.label}
			</label>
			<div className="mt-2 flex gap-2">
				<input
					id="byok"
					type="password"
					autoComplete="off"
					className="min-w-0 flex-1 rounded-lg border border-border bg-bg p-2 text-fg outline-none focus:border-accent"
					placeholder={project.provider.placeholder}
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
				/>
				<button
					type="button"
					className="rounded-lg bg-accent px-4 font-medium text-bg disabled:opacity-40"
					disabled={!draft.trim()}
					onClick={() => {
						if (draft.trim()) onSet(draft.trim());
						setDraft("");
					}}
				>
					Set
				</button>
			</div>
			<p className="mt-2 text-muted text-xs">{project.provider.help}</p>
		</div>
	);
}
