import { expect, test } from "@playwright/test";

// A unique, recognizable fake key. If this string ever escapes to localStorage,
// a cookie, the DOM, or any non-same-origin request, the test fails.
const SENTINEL = "sk-test-LEAK-SENTINEL-0000000000000000";

test("BYOK key never leaks; streamed output renders", async ({ page, baseURL }) => {
	const origin = new URL(baseURL ?? "http://localhost:3000").origin;

	// Record every request so we can prove the key only ever goes to same-origin /api/run.
	const offenders: string[] = [];
	page.on("request", (req) => {
		const url = req.url();
		const sameOrigin = url.startsWith(origin);
		const inUrl = url.includes(SENTINEL);
		const inHeader = Object.values(req.headers()).some((v) => v.includes(SENTINEL));
		const inBody = (req.postData() ?? "").includes(SENTINEL);
		if ((inUrl || inHeader || inBody) && !(sameOrigin && new URL(url).pathname === "/api/run")) {
			offenders.push(url);
		}
	});

	// Stub the BYOK route so no real provider/key is needed; capture its request.
	let runHeaderKey: string | null = null;
	await page.route("**/api/run", async (route) => {
		runHeaderKey = route.request().headers()["x-provider-key"] ?? null;
		await route.fulfill({
			status: 200,
			headers: { "content-type": "text/plain; charset=utf-8" },
			body: "Mock OK from the stubbed route.",
		});
	});

	await page.goto("/");

	// Set the key.
	await page.getByLabel("API key").fill(SENTINEL);
	await page.getByRole("button", { name: "Set" }).click();

	// It lands in sessionStorage only — not localStorage, not cookies.
	const session = await page.evaluate(() => window.sessionStorage.getItem("byok:key"));
	const local = await page.evaluate(() => JSON.stringify(window.localStorage));
	const cookies = await page.evaluate(() => document.cookie);
	expect(session).toBe(SENTINEL);
	expect(local).not.toContain(SENTINEL);
	expect(cookies).not.toContain(SENTINEL);

	// It is not rendered anywhere in the DOM (masked input, length-only display).
	expect(await page.content()).not.toContain(SENTINEL);

	// Run a prompt; the stubbed stream renders.
	await page.getByLabel("Prompt").fill("hello");
	await page.getByRole("button", { name: "Run" }).click();
	await expect(page.getByText("Mock OK from the stubbed route.")).toBeVisible();

	// The key was sent to /api/run (per-request, server-side proxy) and nowhere else.
	expect(runHeaderKey).toBe(SENTINEL);
	expect(offenders, `key leaked to: ${offenders.join(", ")}`).toHaveLength(0);
});
