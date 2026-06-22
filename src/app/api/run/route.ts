import { runCapability } from "@/lib/capability";
import { redactSecret } from "@/lib/secret";

// The BYOK proxy. The browser cannot call most providers directly (CORS +
// key exposure), so the key rides in per-request, is used here, and is never
// persisted or logged. Frozen contract — see AGENTS.md.
export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
	const apiKey = req.headers.get("x-provider-key")?.trim() ?? "";
	if (!apiKey) {
		return new Response("Missing API key. Paste your key to run the demo.", { status: 401 });
	}

	let prompt = "";
	try {
		const body = (await req.json()) as { prompt?: unknown };
		prompt = typeof body.prompt === "string" ? body.prompt : "";
	} catch {
		return new Response("Invalid request body.", { status: 400 });
	}
	if (!prompt.trim()) {
		return new Response("Empty prompt.", { status: 400 });
	}

	const encoder = new TextEncoder();
	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			try {
				for await (const chunk of runCapability({ apiKey, prompt, signal: req.signal })) {
					controller.enqueue(encoder.encode(chunk));
				}
			} catch (err) {
				// The key must never appear in an error returned to the client or logged.
				const message = redactSecret(err instanceof Error ? err.message : String(err), apiKey);
				controller.enqueue(encoder.encode(`\n[error] ${message}`));
			} finally {
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
	});
}
