import type { CapabilityInput } from "./capability-types";

export type { CapabilityInput } from "./capability-types";

// ─────────────────────────────────────────────────────────────────────────────
// ⟨ FILL HERE ⟩ — the ONE slot the autopilot replaces per project.
//
// Swap this mock for a real provider call and add that provider's SDK to
// dependencies. Default provider is OpenAI (the `openai` package, Responses API,
// streamed; `@openai/agents` for agent demos). Use `@anthropic-ai/sdk`
// (`messages.stream`) when the idea is better in Claude. Verify the current
// model id at build time — never hardcode a stale one.
//
// Keep the BYOK contract intact: read the key from `input.apiKey`, stream text
// back, and NEVER persist or log it (the route + redactSecret enforce the rest).
//
// OpenAI reference (left unwired so the template has zero AI dependencies):
//   import OpenAI from "openai";
//   const client = new OpenAI({ apiKey: input.apiKey });
//   const stream = await client.responses.create({
//     model: "<current-model-id>", input: input.prompt, stream: true,
//   });
//   for await (const event of stream) {
//     if (event.type === "response.output_text.delta") yield event.delta;
//   }
// ─────────────────────────────────────────────────────────────────────────────
export async function* runCapability(input: CapabilityInput): AsyncGenerator<string> {
	// Mock: proves the BYOK → stream → render loop with no provider dependency,
	// so the starter is CI-green and deployable before any real model is wired.
	const reply = [
		"This is the AI App Starter mock response.",
		`Your prompt was: "${input.prompt.slice(0, 200)}".`,
		"Wire a provider into src/lib/capability.ts to ship a real demo.",
	].join(" ");
	for (const word of reply.split(" ")) {
		if (input.signal?.aborted) return;
		yield `${word} `;
		await new Promise((resolve) => setTimeout(resolve, 20));
	}
}
