import type { LanguageModel, ToolSet, UIMessage } from "ai";

/**
 * The capability contract — stable across every project. Only the body of
 * `buildCapability` in `capability.ts` changes per project, not this shape.
 *
 * The route hands the BYOK key + the conversation in; the capability returns a
 * provider model (built with THAT key), a system prompt, and any tools the demo
 * needs. The route runs `streamText` and streams a UI-message response back.
 */
export interface CapabilityInput {
	/** The visitor's BYOK API key. Used to build the provider client; never stored or logged. */
	apiKey: string;
	/** The selected `provider/model` id (from `lib/models.ts`). */
	modelId: string;
	/** The full conversation from the client (`useChat` messages). */
	messages: UIMessage[];
}

export interface CapabilitySpec {
	/** The provider model, constructed with the visitor's key. */
	model: LanguageModel;
	/** System prompt steering the demo. */
	system?: string;
	/** Tools the model may call (e.g. in-conversation image generation). */
	tools?: ToolSet;
}
