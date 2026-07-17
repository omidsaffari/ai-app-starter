/**
 * Per-project metadata. The autopilot edits THIS file for each release — name,
 * tagline, repo URL. Copy only; the agent itself lives in `agent/`.
 */
export const project = {
	name: "AI App Starter",
	tagline: "A durable eve agent with tools, skills, and approvals — deploy your own in one click.",
	repoUrl: "https://github.com/omidsaffari/ai-app-starter",
	siteUrl: "https://ai-app-starter.vercel.app",
	// The logo links here. UTMs attribute the visit in omidsaffari.com analytics:
	// utm_source = this demo's slug (the autopilot sets it per release),
	// utm_medium = oss-demo, utm_campaign = labs (groups all demo traffic).
	authorUrl:
		"https://omidsaffari.com/?utm_source=ai-app-starter&utm_medium=oss-demo&utm_campaign=labs",
} as const;
