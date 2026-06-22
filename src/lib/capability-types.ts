/**
 * The capability contract. Stable across every project — only the body of
 * `runCapability` in `capability.ts` changes per project, not this shape.
 */
export interface CapabilityInput {
	/** The visitor's BYOK API key. Use it for the provider call; never store or log it. */
	apiKey: string;
	/** The user's input from the UI. */
	prompt: string;
	/** Aborts when the client disconnects. */
	signal?: AbortSignal;
}
