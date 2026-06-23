import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { buildCapability } from "@/lib/capability";
import { redactSecret } from "@/lib/secret";

// The BYOK proxy. The browser can't call most providers directly (CORS + key
// exposure), so the key rides in per-request via `x-provider-key`, is used here
// to build the provider client, and is never persisted or logged. The route
// streams an AI-SDK UI-message response (text → markdown, image tool → file
// parts rendered in-column). Frozen contract — see AGENTS.md.
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request): Promise<Response> {
	const apiKey = req.headers.get("x-provider-key")?.trim() ?? "";
	if (!apiKey) {
		return new Response("Missing API key. Paste your key to run the demo.", { status: 401 });
	}

	let messages: UIMessage[];
	try {
		const body = (await req.json()) as { messages?: unknown };
		if (!Array.isArray(body.messages)) {
			return new Response("Invalid request body.", { status: 400 });
		}
		messages = body.messages as UIMessage[];
	} catch {
		return new Response("Invalid request body.", { status: 400 });
	}

	const { model, system, tools } = buildCapability({ apiKey, messages });

	const result = streamText({
		model,
		system,
		tools,
		messages: await convertToModelMessages(messages),
		abortSignal: req.signal,
	});

	// The key must never surface in an error returned to the client or logged.
	return result.toUIMessageStreamResponse({
		onError: (error) =>
			redactSecret(error instanceof Error ? error.message : String(error), apiKey),
	});
}
