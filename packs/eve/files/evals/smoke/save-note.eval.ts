import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

// Run with `eve eval` (or `eve eval smoke`). Exercises the tool + approval
// path end to end: the save_note tool asks for approval once per session.
export default defineEval({
	description: "The agent saves a note through the approval gate and confirms it.",
	async test(t) {
		const turn = await t.start("Save a note titled Standup with the body: ship the eve pack.");
		await t.requireInputRequest();
		await t.respondAll("approve");
		await turn.result();
		t.succeeded();
		t.calledTool("save_note");
		t.check(t.reply, includes("Standup"));
	},
});
