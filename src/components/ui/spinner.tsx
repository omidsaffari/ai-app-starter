import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

// svg's strokeWidth is string | number; HugeiconsIcon wants number — omit it from the passthrough
function Spinner({ className, ...props }: Omit<React.ComponentProps<"svg">, "strokeWidth">) {
	return (
		<HugeiconsIcon
			icon={Loading03Icon}
			strokeWidth={2}
			data-slot="spinner"
			role="status"
			aria-label="Loading"
			className={cn("size-4 animate-spin", className)}
			{...props}
		/>
	);
}

export { Spinner };
