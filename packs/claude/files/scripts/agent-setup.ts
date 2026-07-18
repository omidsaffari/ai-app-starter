import { spawnSync } from "node:child_process";
import { createReadStream, existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic, { toFile } from "@anthropic-ai/sdk";
import {
	coordinatorDefinition,
	ENVIRONMENT_DEFINITION,
	GITHUB_MCP_URL,
	MEMORY_SEED,
	MEMORY_STORE_DEFINITION,
	RESEARCHER_DEFINITION,
	scheduleDefinition,
} from "../src/lib/agent/definition";

/**
 * One-shot provisioning: creates the agent pair, environment, and memory
 * store on YOUR Anthropic account and prints the IDs for .env.local /
 * Vercel env. Creating resources is FREE — tokens bill only when sessions
 * run.
 *
 *   bun run agent:setup                  the standard set
 *   bun run agent:setup --with-github-mcp  + vault (needs GITHUB_TOKEN, fine-grained PAT)
 *   bun run agent:setup --with-schedule    + weekly cron deployment ⚠ BILLS ON CADENCE
 *   bun run agent:setup --force            proceed even if AGENT_ID is already set
 */

const args = new Set(process.argv.slice(2));

if (!process.env.ANTHROPIC_API_KEY) {
	console.error("ANTHROPIC_API_KEY is not set. Put it in .env.local and re-run.");
	process.exit(1);
}
if (process.env.AGENT_ID && !args.has("--force")) {
	console.error(
		"AGENT_ID is already set — re-running would create duplicate resources on your account. Pass --force if that is what you want.",
	);
	process.exit(1);
}

const client = new Anthropic();

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

async function uploadSkill(): Promise<string | undefined> {
	const skillRoot = join(SCRIPT_DIR, "..", "skill");
	if (!existsSync(skillRoot)) return undefined;
	const [skillDir] = readdirSync(skillRoot);
	if (!skillDir) return undefined;

	const zipPath = join(SCRIPT_DIR, "..", ".skill-upload.zip");
	const zip = spawnSync("zip", ["-r", zipPath, skillDir], { cwd: skillRoot });
	if (zip.status !== 0) {
		console.warn("zip failed — skipping skill upload (install `zip` and re-run).");
		return undefined;
	}
	const skill = await client.beta.skills.create({
		files: [await toFile(createReadStream(zipPath), `${skillDir}.zip`)],
	});
	rmSync(zipPath, { force: true });
	console.log(`skill        ${skill.id} (${skillDir})`);
	return skill.id;
}

async function maybeCreateVault(): Promise<string | undefined> {
	if (!args.has("--with-github-mcp")) return undefined;
	const token = process.env.GITHUB_TOKEN;
	if (!token) {
		console.error("--with-github-mcp needs GITHUB_TOKEN (fine-grained PAT, minimum scopes).");
		process.exit(1);
	}
	const vault = await client.beta.vaults.create({ display_name: "agent credentials" });
	await client.beta.vaults.credentials.create(vault.id, {
		display_name: "GitHub MCP",
		auth: { type: "static_bearer", mcp_server_url: GITHUB_MCP_URL, token },
	});
	console.log(`vault        ${vault.id} (GitHub MCP credential registered)`);
	return vault.id;
}

const skillId = await uploadSkill();
const vaultId = await maybeCreateVault();

// biome-ignore lint/suspicious/noExplicitAny: definitions are plain data validated server-side
const researcher = await client.beta.agents.create(RESEARCHER_DEFINITION as any);
console.log(
	`researcher   ${researcher.id} v${researcher.version} (${RESEARCHER_DEFINITION.model})`,
);

const coordinatorParams = coordinatorDefinition({
	researcherAgentId: researcher.id,
	skillId,
	githubMcp: args.has("--with-github-mcp"),
});
// biome-ignore lint/suspicious/noExplicitAny: definitions are plain data validated server-side
const coordinator = await client.beta.agents.create(coordinatorParams as any);
console.log(`agent        ${coordinator.id} v${coordinator.version}`);

// biome-ignore lint/suspicious/noExplicitAny: definitions are plain data validated server-side
const environment = await client.beta.environments.create(ENVIRONMENT_DEFINITION as any);
console.log(`environment  ${environment.id} (cloud, limited networking)`);

const store = await client.beta.memoryStores.create(MEMORY_STORE_DEFINITION);
await client.beta.memoryStores.memories.create(store.id, MEMORY_SEED);
console.log(`memory       ${store.id} (seeded ${MEMORY_SEED.path})`);

if (args.has("--with-schedule")) {
	console.warn(
		"\n⚠ Creating a WEEKLY scheduled deployment. Every run bills YOUR key at standard token rates until you pause or archive it in Console > Deployments.",
	);
	const deployment = await client.beta.deployments.create(
		// biome-ignore lint/suspicious/noExplicitAny: definitions are plain data validated server-side
		scheduleDefinition(coordinator.id, environment.id) as any,
	);
	console.log(`deployment   ${deployment.id} (Fridays 18:00 UTC)`);
}

console.log("\nAdd to .env.local (and your Vercel project env):\n");
console.log(`AGENT_ID=${coordinator.id}`);
console.log(`AGENT_ENVIRONMENT_ID=${environment.id}`);
console.log(`AGENT_MEMORY_STORE_ID=${store.id}`);
if (vaultId) console.log(`AGENT_VAULT_ID=${vaultId}`);
