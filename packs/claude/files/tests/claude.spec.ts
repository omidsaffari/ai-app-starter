import { expect, test } from "@playwright/test";

/**
 * The free mount smoke: proves the applied app builds, serves, and FAILS
 * CLOSED — zero model calls, zero Anthropic traffic. CI runs this with no
 * ANTHROPIC_API_KEY in the environment, which is the state under test.
 * (Running locally with your key exported will legitimately flip the app
 * into configured mode and fail this spec — unset the key first.)
 */

test("unconfigured deployment fails closed: no key UI, 503 sessions, no Anthropic traffic", async ({
	page,
	request,
	baseURL,
}) => {
	// Record every request the page makes; none may leave for Anthropic.
	const external: string[] = [];
	page.on("request", (req) => {
		const url = req.url();
		if (url.includes("anthropic.com")) external.push(url);
	});

	// Health is always 200 and honest about configuration.
	const health = await request.get(`${baseURL}/api/agent/health`);
	expect(health.status()).toBe(200);
	const healthBody = (await health.json()) as { ok: boolean; configured: boolean };
	expect(healthBody.ok).toBe(true);
	expect(healthBody.configured).toBe(false);

	// Every billing route refuses with the honest 503 body.
	const create = await request.post(`${baseURL}/api/agent/sessions`, { data: {} });
	expect(create.status()).toBe(503);
	expect(((await create.json()) as { error: string }).error).toBe("not_configured");

	const list = await request.get(`${baseURL}/api/agent/sessions`);
	expect(list.status()).toBe(503);

	// The page renders the fail-closed face — setup guidance, no key input.
	await page.goto("/");
	await expect(page.getByTestId("agent-unconfigured")).toBeVisible();
	await expect(page.getByTestId("byok-input")).toHaveCount(0);
	await expect(page.locator("input[type=password]")).toHaveCount(0);

	expect(external, `unexpected Anthropic traffic: ${external.join(", ")}`).toHaveLength(0);
});
