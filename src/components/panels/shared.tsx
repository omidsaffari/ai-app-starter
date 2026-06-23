import Link from "next/link";
import type React from "react";

/**
 * Panel furniture — ported verbatim from dvnc-cloud `panels/shared.tsx` so every
 * demo's side panel has the exact same structure and rhythm as the dvnc.cloud
 * dashboard. Compose a panel as:
 *
 *   <Panel label="Get started" description={<PanelGuide steps={[...]} />} banner={<KeyGate/>} />
 *
 * The SectionPanel mounts this inside `px-3 py-2`; Panel adds `px-2`, so content
 * sits at the same 20px inset dvnc-cloud uses.
 */

// ─── Panel (reusable wrapper with slots) ─────────────────────────────────────

/**
 * Panel — consistent sidebar panel structure.
 *
 * Layout:
 *  label        ← 11px uppercase whisper
 *  description  ← intro text or rich content (guide steps)
 *  banner       ← create button / form / the key-gate
 *  children     ← list items (PanelList), placeholder, loading
 *  footer       ← "View all" link, etc.
 */
export function Panel({
	label,
	description,
	action,
	banner,
	children,
	footer,
}: {
	label: string;
	description?: React.ReactNode;
	action?: React.ReactNode;
	banner?: React.ReactNode;
	children?: React.ReactNode;
	footer?: React.ReactNode;
}) {
	return (
		<div className="px-2">
			{/* Label row */}
			<div className="mb-5 flex h-8 items-center justify-between">
				<h3 className="text-muted-foreground/50 text-[11px] uppercase tracking-widest">{label}</h3>
				{action}
			</div>

			{/* Description — string or rich content */}
			{description && (
				<div className="pb-5">
					{typeof description === "string" ? (
						<p className="text-muted-foreground text-xs">{description}</p>
					) : (
						description
					)}
				</div>
			)}

			{/* Banner — create form, search, the key-gate */}
			{banner && <div className="pb-5">{banner}</div>}

			{/* Content — list, placeholder, loading */}
			{children && <div className="pb-5">{children}</div>}

			{/* Footer */}
			{footer && <div className="pb-4">{footer}</div>}
		</div>
	);
}

// ─── Panel content helpers ───────────────────────────────────────────────────

/**
 * PanelGuide — the numbered 1·2·3 step block dvnc-cloud panels use in their
 * `description` to explain "how this works": a filled chip + text per step, with
 * an optional muted footnote.
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

export function PanelPlaceholder({ title, description }: { title: string; description: string }) {
	return (
		<div>
			<p className="text-foreground text-[13px] font-medium">{title}</p>
			<p className="text-muted-foreground mt-1 text-xs">{description}</p>
		</div>
	);
}

export function PanelLoading() {
	return (
		<div>
			<div className="bg-muted h-4 w-32 animate-pulse rounded" />
			<div className="bg-muted mt-2 h-3 w-24 animate-pulse rounded" />
		</div>
	);
}

/** PanelList — vertical list with consistent gap. */
export function PanelList({ children }: { children: React.ReactNode }) {
	return <div className="flex flex-col gap-1.5">{children}</div>;
}

/** PanelItem — clickable list row with hover state. */
export function PanelItem({
	href,
	title,
	subtitle,
	badgeLabel,
	badgeClassName,
	isActive,
	className,
	icon,
	children,
}: {
	href?: string;
	title: string;
	subtitle?: string;
	badgeLabel?: string;
	badgeClassName?: string;
	isActive?: boolean;
	className?: string;
	icon?: React.ReactNode;
	children?: React.ReactNode;
}) {
	const inner = (
		<>
			<div className="flex items-center justify-between">
				<div className="min-w-0 flex-1">
					<p className="truncate text-[13px] font-medium">{title}</p>
					{subtitle && (
						<p className="text-muted-foreground/70 mt-0.5 truncate text-[11px]">{subtitle}</p>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-2">
					{badgeLabel && (
						<span
							className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClassName ?? "bg-muted text-muted-foreground"}`}
						>
							{badgeLabel}
						</span>
					)}
					{icon}
				</div>
			</div>
			{children}
		</>
	);

	const baseClass = `flex flex-col gap-0.5 rounded-lg px-2.5 py-2.5 transition-all duration-150 ${isActive ? "bg-muted" : "hover:bg-muted/50"} ${className ?? ""}`;

	if (!href) {
		return <div className={baseClass}>{inner}</div>;
	}
	return (
		<Link href={href} className={baseClass}>
			{inner}
		</Link>
	);
}

export function PanelDivider() {
	return <hr className="border-border border-dashed" />;
}
