import { defineAgent } from "eve";

// Gateway model ids are DOTTED (anthropic/claude-opus-4.8); direct provider ids
// are hyphenated. Verify the current id at build time — never trust a hardcoded one.
export default defineAgent({
	model: "anthropic/claude-sonnet-5",
	// Session spend caps — when no human is reachable (schedules, subagents) the
	// session fails with SESSION_TOKEN_LIMIT_REACHED instead of prompting.
	limits: { maxOutputTokensPerSession: 200_000 },
});
