"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

/** Label — a quiet, medium-weight field label. */
function Label({ className, ...props }: React.ComponentProps<"label">) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: reusable primitive — callers pass htmlFor or wrap a control
		<label
			data-slot="label"
			className={cn(
				"text-foreground flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export { Label };
