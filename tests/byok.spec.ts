import { expect, test } from "@playwright/test";

// A unique, recognizable fake key. If this string ever escapes to localStorage,
// a cookie, the DOM, or any non-same-origin request, the test fails. This test
// is UI-agnostic: it drives the app through stable `data-testid` hooks and the
// textarea's `aria-label`, not visible copy — so it survives a kit restyle.
const SENTINEL = "sk-test-LEAK-SENTINEL-0000000000000000";

// A valid AI-SDK v6 UI-message SSE stream the stubbed route returns, so `useChat`
// renders without any real provider/key. No network leaves the test.
const MOCK_REPLY = "Mock OK from the stubbed route.";
const MOCK_STREAM = [
	{ type: "start" },
	{ type: "text-start", id: "0" },
	{ type: "text-delta", id: "0", delta: MOCK_REPLY },
	{ type: "text-end", id: "0" },
	{ type: "finish" },
]
	.map((c) => `data: ${JSON.stringify(c)}\n\n`)
	.concat("data: [DONE]\n\n")
	.join("");

test("BYOK key never leaks; the key only rides x-provider-key same-origin; output renders", async ({
	page,
	baseURL,
}) => {
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

	// Stub the BYOK route so no real provider/key is needed; capture its key header.
	let runHeaderKey: string | null = null;
	await page.route("**/api/run", async (route) => {
		runHeaderKey = route.request().headers()["x-provider-key"] ?? null;
		await route.fulfill({
			status: 200,
			headers: {
				"content-type": "text/event-stream",
				"x-vercel-ai-ui-message-stream": "v1",
			},
			body: MOCK_STREAM,
		});
	});

	await page.goto("/");

	// Set the key via the stable testid hooks (no reliance on visible labels).
	await page.getByTestId("byok-input").fill(SENTINEL);
	await page.getByTestId("byok-set").click();

	// It lands in sessionStorage only — not localStorage, not cookies.
	const session = await page.evaluate(() => window.sessionStorage.getItem("byok:key"));
	const local = await page.evaluate(() => JSON.stringify(window.localStorage));
	const cookies = await page.evaluate(() => document.cookie);
	expect(session).toBe(SENTINEL);
	expect(local).not.toContain(SENTINEL);
	expect(cookies).not.toContain(SENTINEL);

	// It is never rendered anywhere in the DOM (masked input, length-only display).
	expect(await page.content()).not.toContain(SENTINEL);

	// Send a prompt; the stubbed stream renders in the conversation.
	await page.getByLabel("Prompt").fill("hello");
	await page.getByLabel("Prompt").press("Enter");
	await expect(page.getByText(MOCK_REPLY)).toBeVisible();

	// The key was sent to /api/run (per-request, server-side proxy) and nowhere else.
	expect(runHeaderKey).toBe(SENTINEL);
	expect(offenders, `key leaked to: ${offenders.join(", ")}`).toHaveLength(0);
});
