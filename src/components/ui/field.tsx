"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Field — a lean vertical form group, in the spirit of dvnc-cloud's Field but
 * trimmed to what this starter needs: a label + control stacked with a small
 * gap, plus a muted description line. No fieldset/legend/separator machinery.
 */
function Field({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div data-slot="field" className={cn("flex w-full flex-col gap-2", className)} {...props} />
	);
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<p
			data-slot="field-description"
			className={cn("text-muted-foreground/70 text-xs leading-relaxed", className)}
			{...props}
		/>
	);
}

export { Field, FieldDescription };
