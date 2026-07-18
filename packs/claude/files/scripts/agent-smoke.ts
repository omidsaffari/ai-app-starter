import Anthropic from "@anthropic-ai/sdk";

/**
 * THE deliberate billed smoke: one real session turn (cents, on YOUR key).
 * Run once after gates are green — NEVER in CI.
 *
 *   bun run agent:smoke
 */

const { ANTHROPIC_API_KEY, AGENT_ID, AGENT_ENVIRONMENT_ID } = process.env;
if (!ANTHROPIC_API_KEY || !AGENT_ID || !AGENT_ENVIRONMENT_ID) {
	console.error("Needs ANTHROPIC_API_KEY, AGENT_ID, AGENT_ENVIRONMENT_ID (run agent:setup first).");
	process.exit(1);
}

const client = new Anthropic();
const session = await client.beta.sessions.create({
	agent: AGENT_ID,
	environment_id: AGENT_ENVIRONMENT_ID,
	title: "smoke",
});
console.log(`session ${session.id}`);

// Stream first, then send — streams only deliver events emitted after attach.
const stream = await client.beta.sessions.events.stream(session.id);
const timeout = setTimeout(() => {
	console.error("smoke timed out after 180s");
	stream.controller.abort();
	process.exit(1);
}, 180_000);

await client.beta.sessions.events.send(session.id, {
	events: [
		{
			type: "user.message",
			content: [
				{
					type: "text",
					text: "Reply with exactly: SMOKE OK — then end the turn. Do not use any tools.",
				},
			],
		},
	],
});

let text = "";
for await (const event of stream) {
	const e = event as unknown as {
		type: string;
		content?: Array<{ type: string; text?: string }>;
		stop_reason?: { type?: string };
	};
	if (e.type === "agent.message") {
		for (const block of e.content ?? []) if (block.type === "text") text += block.text ?? "";
	} else if (e.type === "session.status_idle") {
		break;
	} else if (e.type === "session.error") {
		console.error("session.error during smoke");
		process.exit(1);
	}
}
clearTimeout(timeout);
stream.controller.abort();

const final = await client.beta.sessions.retrieve(session.id);
console.log(`reply: ${text.trim()}`);
console.log(
	`usage: in=${final.usage?.input_tokens} out=${final.usage?.output_tokens} cache_read=${final.usage?.cache_read_input_tokens}`,
);

if (!text.includes("SMOKE OK")) {
	console.error("smoke FAILED — reply did not contain SMOKE OK");
	process.exit(1);
}
console.log("smoke OK");
