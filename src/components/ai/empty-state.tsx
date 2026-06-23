"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

/** Centered empty-conversation prompt. */
export function EmptyState({
	icon,
	title,
	subtitle,
}: {
	icon: IconSvgElement;
	title: string;
	subtitle?: string;
}) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
			<div className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-full">
				<HugeiconsIcon icon={icon} size={20} />
			</div>
			<p className="text-foreground text-sm font-medium">{title}</p>
			{subtitle && <p className="text-muted-foreground text-[13px]">{subtitle}</p>}
		</div>
	);
}
