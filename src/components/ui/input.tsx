import { Input as InputPrimitive } from "@base-ui/react/input";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input — Labs surface: a borderless, secondary-surfaced field that sits flush
 * inside a panel rather than reading as a stuck-on box. Used by the key-gate
 * (a masked password input) and any demo form. iOS keeps text-base on small
 * screens (globals.css forces 16px) so focus never zooms.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			className={cn(
				"bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-secondary dark:hover:bg-secondary/80 placeholder:text-muted-foreground/60 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-10 w-full min-w-0 rounded-lg border border-transparent px-3 py-1 text-sm shadow-none outline-none transition-colors focus-visible:ring-0 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
