import { defineAgent } from "eve";

// Subagents inherit NOTHING from the root agent — this one gets its own
// instructions and the framework-default tools (web_search, web_fetch, bash…).
// `description` is required: the parent reads it to decide when to delegate.
export default defineAgent({
	description:
		"Investigate open-ended or unfamiliar questions: search, read sources, and return a short evidence-backed brief.",
	model: "anthropic/claude-sonnet-5",
});
