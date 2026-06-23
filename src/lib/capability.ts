import type { CapabilityInput, CapabilitySpec } from "./capability-types";
import { createModel, toolsFor } from "./create-model";

export type { CapabilityInput, CapabilitySpec } from "./capability-types";

// ─────────────────────────────────────────────────────────────────────────────
// ⟨ FILL HERE ⟩ — the ONE logic slot a project tailors per demo.
//
// The visitor picks a model in `lib/models.ts`; the route hands its id +
// the visitor's BYOK key in here. `createModel` builds the matching provider
// client (OpenAI / Anthropic / Google) with that key, and `toolsFor` attaches
// any per-provider tools. The route runs `streamText` over this spec and streams
// a UI-message response — text parts render as markdown, image-tool output
// renders in-column.
//
// Default demo: any chat model in the registry, plus — on OpenAI — the hosted
// `imageGeneration` tool, so a single chat surface does BOTH streamed text AND
// in-conversation images ("draw a red fox" → the model calls the tool, the
// bytes stream back as a file part). To change which models are offered, edit
// `lib/models.ts`; to change providers/capabilities, edit `lib/create-model.ts`.
//
// The BYOK contract stays intact: key in, never persisted or logged — the route
// + redactSecret enforce the rest.
// ─────────────────────────────────────────────────────────────────────────────

export function buildCapability(input: CapabilityInput): CapabilitySpec {
	return {
		model: createModel(input.modelId, input.apiKey),
		system:
			"You are a concise, helpful assistant in a bring-your-own-key demo. " +
			"Answer in clean markdown. When the user asks for a picture, image, or " +
			"illustration, call the image generation tool to create it (if available).",
		tools: toolsFor(input.modelId, input.apiKey),
	};
}
