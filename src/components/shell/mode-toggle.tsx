"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** Dark/light toggle. Renders a stable placeholder until mounted to avoid hydration mismatch. */
export function ModeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const isDark = resolvedTheme === "dark";

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						onClick={() => setTheme(isDark ? "light" : "dark")}
						aria-label="Toggle theme"
					/>
				}
			>
				{mounted ? (
					<HugeiconsIcon icon={isDark ? Sun03Icon : Moon02Icon} size={16} />
				) : (
					<span className="size-4" />
				)}
			</TooltipTrigger>
			<TooltipContent side="right">Toggle theme</TooltipContent>
		</Tooltip>
	);
}
