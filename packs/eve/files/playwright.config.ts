import { defineConfig, devices } from "@playwright/test";

// Port is configurable so local runs don't collide with another dev server.
const PORT = process.env.PORT ?? "3000";
const baseURL = `http://localhost:${PORT}`;

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
		command: "bun run dev",
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 240_000,
	},
});
