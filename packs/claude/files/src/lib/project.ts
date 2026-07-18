/**
 * Per-project metadata. The autopilot edits THIS file for each release — name,
 * tagline, repo URL. The agent definition in `src/lib/agent/definition.ts`
 * reads the name, so renaming here renames the provisioned agent on the next
 * `agent:setup`.
 *
 * Branding note (platform rules): keep the product's own neutral name.
 * "Powered by Claude" is allowed; "Claude Code" / "Claude Cowork" naming and
 * Claude-Code-style visuals are not.
 */
export const project = {
	name: "Agent App Starter",
	tagline:
		"A durable server-side agent, powered by Claude — sandboxed sessions with human-approved actions, memory, and rubric-graded outcomes. Deploy your own copy; it runs on your account.",
	repoUrl: "https://github.com/omidsaffari/ai-app-starter",
	siteUrl: "https://ai-app-starter.vercel.app",
	// The logo links here. UTMs attribute the visit in omidsaffari.com analytics:
	// utm_source = this demo's slug (the autopilot sets it per release),
	// utm_medium = oss-demo, utm_campaign = labs (groups all demo traffic).
	authorUrl:
		"https://omidsaffari.com/?utm_source=ai-app-starter&utm_medium=oss-demo&utm_campaign=labs",
} as const;
