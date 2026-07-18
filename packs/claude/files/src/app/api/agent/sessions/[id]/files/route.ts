import { getAgentClient, isConfigured, notConfiguredResponse } from "@/lib/agent/client";

/**
 * Outcome deliverables: the agent writes to /mnt/session/outputs/ in the
 * sandbox; the Files API exposes them scoped to the session. `?file=` proxies
 * a download so the browser never needs an Anthropic credential.
 */
export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<Response> {
	const client = getAgentClient();
	if (!client || !isConfigured()) return notConfiguredResponse();
	const { id } = await params;

	const url = new URL(req.url);
	const fileId = url.searchParams.get("file");
	if (fileId) {
		const content = await client.beta.files.download(fileId);
		const name = url.searchParams.get("name") ?? "download";
		return new Response(await content.arrayBuffer(), {
			headers: {
				"content-type": "application/octet-stream",
				"content-disposition": `attachment; filename="${name.replaceAll('"', "")}"`,
			},
		});
	}

	// scope_id filtering needs the managed-agents beta ON the files request.
	const files = await client.beta.files.list({
		scope_id: id,
		betas: ["managed-agents-2026-04-01"],
	});
	return Response.json({
		files: files.data.map((f) => ({ id: f.id, filename: f.filename, size: f.size_bytes })),
	});
}
