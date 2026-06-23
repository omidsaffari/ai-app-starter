"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

/** Label — ported from dvnc-cloud. A quiet, medium-weight field label. */
function Label({ className, ...props }: React.ComponentProps<"label">) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: reusable primitive — callers pass htmlFor or wrap a control
		<label
			data-slot="label"
			className={cn(
				"text-foreground flex select-none items-center gap-2 text-[13px] font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export { Label };
