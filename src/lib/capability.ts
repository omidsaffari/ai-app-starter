import { createOpenAI } from "@ai-sdk/openai";
import type { CapabilityInput, CapabilitySpec } from "./capability-types";

export type { CapabilityInput, CapabilitySpec } from "./capability-types";

// ─────────────────────────────────────────────────────────────────────────────
// ⟨ FILL HERE ⟩ — the ONE logic slot the autopilot replaces per project.
//
// Build the provider model from the visitor's BYOK key (`input.apiKey`) and
// return it plus a system prompt and any tools. The route (`/api/run`) runs
// `streamText` over this spec and streams a UI-message response — text parts
// render as markdown, image-generation tool output renders in-column.
//
// Default demo: OpenAI on the Responses API with the hosted `imageGeneration`
// tool, so a single chat surface does BOTH streamed text AND in-conversation
// images ("draw a red fox" → the model calls the tool, the bytes stream back as
// a file part). Swap `createAnthropic`/`createGoogleGenerativeAI` + a different
// model id for other providers; keep the BYOK contract intact (key in, never
// persisted or logged — the route + redactSecret enforce the rest).
//
// Model ids drift — re-verify the current one at build time, never trust a
// hardcoded string blindly.
// ─────────────────────────────────────────────────────────────────────────────

/** Override at build time per project if a newer id has shipped. */
const MODEL_ID = "gpt-5";

export function buildCapability(input: CapabilityInput): CapabilitySpec {
	const openai = createOpenAI({ apiKey: input.apiKey });
	return {
		model: openai.responses(MODEL_ID),
		system:
			"You are a concise, helpful assistant in a bring-your-own-key demo. " +
			"Answer in clean markdown. When the user asks for a picture, image, or " +
			"illustration, call the image generation tool to create it.",
		tools: {
			image_generation: openai.tools.imageGeneration({ outputFormat: "webp" }),
		},
	};
}
