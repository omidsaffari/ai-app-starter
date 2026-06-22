"use client";

import { useRef, useState } from "react";
import { KeyGate } from "@/components/key-gate";
import { streamPrompt, useByokKey } from "@/lib/byok";
import { project } from "@/lib/project";

export default function Home() {
	const { key, setKey, clear, hasKey } = useByokKey();
	const [prompt, setPrompt] = useState("");
	const [output, setOutput] = useState("");
	const [running, setRunning] = useState(false);
	const abortRef = useRef<AbortController | null>(null);

	async function run() {
		if (!hasKey || !prompt.trim() || running) return;
		setRunning(true);
		setOutput("");
		const ctrl = new AbortController();
		abortRef.current = ctrl;
		try {
			for await (const chunk of streamPrompt(prompt, key, ctrl.signal)) {
				setOutput((o) => o + chunk);
			}
		} catch (err) {
			setOutput((o) => `${o}\n[error] ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			setRunning(false);
			abortRef.current = null;
		}
	}

	return (
		<div className="mx-auto w-full max-w-2xl px-5 py-16">
			<h1 className="font-semibold text-3xl tracking-tight">{project.name}</h1>
			<p className="mt-2 text-muted">{project.tagline}</p>

			<div className="mt-8">
				<KeyGate value={key} hasKey={hasKey} onSet={setKey} onClear={clear} />
			</div>

			<label className="mt-8 block text-muted text-sm" htmlFor="prompt">
				Prompt
			</label>
			<textarea
				id="prompt"
				className="mt-2 h-28 w-full resize-y rounded-xl border border-border bg-card p-3 text-fg outline-none focus:border-accent disabled:opacity-50"
				value={prompt}
				onChange={(e) => setPrompt(e.target.value)}
				placeholder={hasKey ? "Ask something…" : "Set your key first"}
				disabled={!hasKey}
			/>
			<button
				type="button"
				className="mt-3 rounded-xl bg-accent px-4 py-2 font-medium text-bg disabled:opacity-40"
				disabled={!hasKey || !prompt.trim() || running}
				onClick={run}
			>
				{running ? "Running…" : "Run"}
			</button>

			{output && (
				<pre className="mt-6 whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-fg text-sm">
					{output}
				</pre>
			)}
		</div>
	);
}
