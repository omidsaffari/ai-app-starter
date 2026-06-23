import type { Provider } from "@/lib/models";

/**
 * Per-project metadata. The autopilot edits THIS file for each release — name,
 * tagline, repo URL.
 *
 * This file holds copy only. The actual model call lives in `capability.ts`,
 * and which models the visitor can pick lives in `models.ts`.
 */
export const project = {
	name: "AI App Starter",
	tagline:
		"A bring-your-own-key chat + image demo — paste your own API key; it never leaves your session.",
	repoUrl: "https://github.com/omidsaffari/ai-app-starter",
} as const;

/**
 * Per-provider key-field copy. The key-gate reads from here based on the
 * CURRENTLY selected model's provider, so the label/placeholder always match
 * the key the visitor needs to paste.
 */
export const PROVIDER_COPY: Record<
	Provider,
	{ label: string; placeholder: string; consoleUrl: string }
> = {
	openai: {
		label: "OpenAI API key",
		placeholder: "sk-…",
		consoleUrl: "https://platform.openai.com/api-keys",
	},
	anthropic: {
		label: "Anthropic API key",
		placeholder: "sk-ant-…",
		consoleUrl: "https://console.anthropic.com/settings/keys",
	},
	google: {
		label: "Google AI API key",
		placeholder: "AIza…",
		consoleUrl: "https://aistudio.google.com/apikey",
	},
};
