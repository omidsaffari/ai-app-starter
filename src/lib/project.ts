/**
 * Per-project metadata. The autopilot edits THIS file for each release — name,
 * tagline, repo URL, and the key-field copy for whichever provider the demo
 * uses (OpenAI by default, Anthropic/Google when the idea fits them better).
 *
 * This file holds copy only. The actual model call lives in `capability.ts`.
 */
export const project = {
	name: "AI App Starter",
	tagline:
		"A bring-your-own-key chat + image demo — paste your own API key; it never leaves your session.",
	repoUrl: "https://github.com/omidsaffari/ai-app-starter",
	provider: {
		label: "OpenAI API key",
		placeholder: "sk-…",
		help: "Your key is used only for this request and is never stored or logged. It stays in this browser session.",
	},
} as const;
