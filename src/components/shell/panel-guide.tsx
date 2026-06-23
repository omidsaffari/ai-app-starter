import type React from "react";

/**
 * PanelGuide — the numbered 1·2·3 step block dvnc-cloud panels use to explain
 * "how this works": a filled chip + text per step, with an optional muted
 * footnote. Ported from dvnc-cloud `panels/shared.tsx`. Reusable furniture for
 * any demo's panel — drop it above or below the key-gate.
 */
export function PanelGuide({
	steps,
	footnote,
}: {
	steps: React.ReactNode[];
	footnote?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-3">
			{steps.map((text, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static, ordered guide steps
				<div key={i} className="flex gap-3">
					<span className="bg-foreground text-background flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
						{i + 1}
					</span>
					<p className="text-muted-foreground text-[13px] leading-relaxed">{text}</p>
				</div>
			))}
			{footnote && (
				<p className="text-muted-foreground/50 text-[11px] leading-relaxed">{footnote}</p>
			)}
		</div>
	);
}
