import { defineTool } from "eve/tools";
import { once } from "eve/tools/approval";
import { z } from "zod";

// Filename = the model-facing tool name (snake_case). Tools run in the APP
// runtime (full process.env) — the sandbox is a separate trust boundary reached
// through ctx.getSandbox().
export default defineTool({
	description: "Save a short note into the session workspace so later turns can read it.",
	inputSchema: z.object({
		title: z.string().min(1).max(80),
		body: z.string().min(1).max(2000),
	}),
	// First call per session asks the human; rest run silently. `always()` /
	// `never()` / custom policies from eve/tools/approval.
	approval: once(),
	async execute({ title, body }, ctx) {
		const sandbox = await ctx.getSandbox();
		const slug =
			title
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "") || "note";
		const path = `/workspace/notes/${slug}.md`;
		// writeTextFile creates parent directories recursively.
		await sandbox.writeTextFile({ path, content: `# ${title}\n\n${body}\n` });
		return { saved: path };
	},
});
