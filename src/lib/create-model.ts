import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel, ToolSet } from "ai";
import { providerOf } from "@/lib/models";

/**
 * Build a provider `LanguageModel` from a namespaced `provider/model` id and the
 * visitor's BYOK key. This is the one place provider clients are constructed —
 * add a provider here (plus an entry in `lib/models.ts`) to support it.
 *
 * The key is used to build the client and is never persisted or logged (the
 * route + `redactSecret` enforce the rest of the BYOK contract).
 */
export function createModel(id: string, apiKey: string): LanguageModel {
	const provider = providerOf(id);
	const model = id.slice(id.indexOf("/") + 1); // strip the `provider/` prefix

	switch (provider) {
		case "anthropic":
			return createAnthropic({ apiKey })(model);
		case "google":
			return createGoogleGenerativeAI({ apiKey })(model);
		default:
			// OpenAI on the Responses API — required for the hosted image tool.
			return createOpenAI({ apiKey }).responses(model);
	}
}

/**
 * Tools for a given model. Today only OpenAI carries the `image` capability, so
 * only it gets the hosted `imageGeneration` tool (text+image in one surface).
 * Structure a per-provider tool path here when another provider gains an image
 * (or other) capability in `lib/models.ts`.
 */
export function toolsFor(id: string, apiKey: string): ToolSet | undefined {
	if (providerOf(id) === "openai") {
		return {
			image_generation: createOpenAI({ apiKey }).tools.imageGeneration({
				outputFormat: "webp",
			}),
		};
	}
	return undefined;
}
