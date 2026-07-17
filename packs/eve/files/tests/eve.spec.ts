import { expect, test } from "@playwright/test";

// UI-agnostic smoke for the eve pack: the Labs surface renders and the eve
// channel is mounted. No model call is made (the POST returns immediately;
// the turn itself would need gateway credentials) — CI stays free.
test("shell renders and the eve session route is mounted", async ({ page, baseURL }) => {
	await page.goto("/");

	await expect(page.getByTestId("chat-surface")).toBeVisible();
	await expect(page.getByLabel("Prompt")).toBeVisible();

	const health = await page.request.get(`${baseURL}/eve/v1/health`);
	expect(health.status(), "eve health route should be mounted").toBe(200);

	const session = await page.request.post(`${baseURL}/eve/v1/session`, {
		data: { message: "ping" },
	});
	expect(session.status(), "eve session route should be mounted").not.toBe(404);
});
