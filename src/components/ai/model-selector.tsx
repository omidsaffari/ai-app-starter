"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MODELS, type ModelOption, modelOption } from "@/lib/models";

/**
 * Model picker — an icon trigger in the composer that opens a small popover of
 * the models in `lib/models.ts`. Ported lean from dvnc-cloud. The current
 * model's provider icon is the trigger; switching providers re-scopes the
 * key-gate to that provider's key.
 */
export function ModelSelector({
	model,
	setModel,
	models = MODELS,
	label = "Model",
}: {
	model: string;
	setModel: (id: string) => void;
	/** Optional curated subset. Defaults to the full MODELS list. */
	models?: ModelOption[];
	/** Popover heading + trigger tooltip. */
	label?: string;
}) {
	const [open, setOpen] = useState(false);
	const current = modelOption(model);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<Tooltip>
				<TooltipTrigger
					render={
						<PopoverTrigger
							aria-label={label}
							data-testid="model-selector"
							className="bg-muted text-muted-foreground hover:bg-muted/80 flex size-8 items-center justify-center rounded-lg transition-colors"
						/>
					}
				>
					<current.Icon />
				</TooltipTrigger>
				<TooltipContent side="top">{current.label}</TooltipContent>
			</Tooltip>
			<PopoverContent
				side="top"
				align="start"
				sideOffset={8}
				className="w-[240px] gap-0 overflow-hidden rounded-xl p-0"
			>
				<div className="border-b border-dashed px-4 py-2.5">
					<span className="text-foreground text-sm font-medium">{label}</span>
					<p className="text-muted-foreground/50 text-[11px]">Pick a provider and model</p>
				</div>
				{models.map((m) => (
					<button
						key={m.id}
						type="button"
						onClick={() => {
							setModel(m.id);
							setOpen(false);
						}}
						className={`flex w-full items-center gap-2.5 px-4 py-2 text-[13px] transition-colors ${
							m.id === model
								? "bg-muted/50 text-foreground"
								: "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
						}`}
					>
						<m.Icon />
						<span className="flex-1 text-left">{m.label}</span>
						{m.id === model && <span className="text-muted-foreground/50">&#10003;</span>}
					</button>
				))}
			</PopoverContent>
		</Popover>
	);
}
