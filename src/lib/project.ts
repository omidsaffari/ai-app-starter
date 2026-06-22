/**
 * Per-project metadata. The autopilot edits THIS file for each release —
 * name, tagline, repo URL, and the key-field copy for whichever provider the
 * project's demo uses (OpenAI by default, Anthropic when building with Claude).
 *
 * This file holds copy only. The actual model call lives in `capability.ts`.
 */
export const project = {
	name: "AI App Starter",
	tagline: "A bring-your-own-key starter — paste your own API key; it never leaves your session.",
	repoUrl: "https://github.com/omidsaffari/ai-app-starter",
	provider: {
		// e.g. "OpenAI API key" / "Anthropic API key" once a provider is wired.
		label: "API key",
		placeholder: "Paste your API key",
		help: "Your key is used only for this request and is never stored or logged.",
	},
} as const;
