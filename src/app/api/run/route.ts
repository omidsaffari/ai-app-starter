import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { buildCapability } from "@/lib/capability";
import { DEFAULT_MODEL_ID, modelOption } from "@/lib/models";
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
	let modelId: string;
	try {
		const body = (await req.json()) as { messages?: unknown; modelId?: unknown };
		if (!Array.isArray(body.messages)) {
			return new Response("Invalid request body.", { status: 400 });
		}
		messages = body.messages as UIMessage[];
		// Resolve to a known model id; an unknown/missing id falls back to the default.
		modelId = typeof body.modelId === "string" ? modelOption(body.modelId).id : DEFAULT_MODEL_ID;
	} catch {
		return new Response("Invalid request body.", { status: 400 });
	}

	const { model, system, tools } = buildCapability({ apiKey, modelId, messages });

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
