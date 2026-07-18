import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Port is configurable so local runs don't collide with another dev server.
const PORT = process.env.PORT ?? "3000";
const baseURL = `http://localhost:${PORT}`;

function resolveNode24(): string {
	const toolCache = process.env.RUNNER_TOOL_CACHE;
	if (!toolCache) return "node";

	const nodeCache = join(toolCache, "node");
	if (!existsSync(nodeCache)) return "node";

	const version = readdirSync(nodeCache)
		.filter((candidate) => /^24\.\d+\.\d+$/.test(candidate))
		.sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
		.at(-1);
	if (!version) return "node";

	const binary = join(nodeCache, version, process.arch, "bin", "node");
	return existsSync(binary) ? binary : "node";
}

export default defineConfig({
	testDir: "./tests",
	timeout: 60_000,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		// Dev mode on purpose: withEve boots the eve server alongside Next from
		// this one command, so /eve/v1/* is mounted without a second process.
		// GitHub's default shell can expose Node 22 even though Node 24 is cached.
		command: `"${resolveNode24()}" node_modules/next/dist/bin/next dev`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 240_000,
	},
});
