import type React from "react";
import { ChatGPTIcon, ClaudeIcon, GeminiIcon } from "@/components/ai/provider-icons";

/**
 * THE MODEL CONFIG — edit here to add or verify models.
 *
 * This is the one list a demo touches to change which providers/models the
 * visitor can pick. Ids are namespaced `provider/model`; `createModel` strips
 * the `provider/` prefix and builds the matching `@ai-sdk/*` client with the
 * visitor's BYOK key. The picker (`ModelSelector`) renders straight off MODELS.
 *
 * ⚠ Model ids drift — verify each id is current at build time (the installed
 * `@ai-sdk/{openai,anthropic,google}` type unions are the source of truth).
 * These were verified against the SDK type unions in June 2026.
 *
 * NOTE: only `openai/*` carries the `image` capability today — the in-chat
 * image tool is the OpenAI hosted `imageGeneration` tool (see `create-model.ts`
 * + `capability.ts`). Anthropic/Google are text-only here; add an image path in
 * `create-model.ts` before flagging them `image`.
 */

export type Provider = "openai" | "anthropic" | "google";

export type Capability = "text" | "image";

export interface ModelOption {
	/** Namespaced id: `provider/model`. */
	id: string;
	/** Short display label for the picker. */
	label: string;
	provider: Provider;
	capabilities: Capability[];
	/** Brand mark for the picker. */
	Icon: React.ComponentType;
}

export const MODELS: ModelOption[] = [
	{
		id: "openai/gpt-5.5",
		label: "GPT-5.5",
		provider: "openai",
		capabilities: ["text", "image"],
		Icon: ChatGPTIcon,
	},
	{
		id: "anthropic/claude-sonnet-4.6",
		label: "Claude Sonnet 4.6",
		provider: "anthropic",
		capabilities: ["text"],
		Icon: ClaudeIcon,
	},
	{
		id: "google/gemini-3.5-flash",
		label: "Gemini 3.5 Flash",
		provider: "google",
		capabilities: ["text"],
		Icon: GeminiIcon,
	},
];

/** The default selection — OpenAI, so the in-chat image tool works out of the box. */
export const DEFAULT_MODEL_ID = "openai/gpt-5.5";

const MODEL_MAP = new Map(MODELS.map((m) => [m.id, m]));

/** Look up a model option; falls back to the default if the id is unknown. */
export function modelOption(id: string): ModelOption {
	return MODEL_MAP.get(id) ?? MODEL_MAP.get(DEFAULT_MODEL_ID) ?? MODELS[0];
}

/** The provider half of a `provider/model` id (falls back to the default's). */
export function providerOf(id: string): Provider {
	const prefix = id.split("/")[0];
	if (prefix === "openai" || prefix === "anthropic" || prefix === "google") return prefix;
	return modelOption(id).provider;
}
