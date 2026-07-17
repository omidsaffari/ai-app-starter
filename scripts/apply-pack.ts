/**
 * Apply ONE platform capability pack to this project, then remove the packs
 * machinery so the published repo carries only the applied platform.
 *
 *   bun scripts/apply-pack.ts <pack>     apply packs/<pack>/ per its pack.json
 *   bun scripts/apply-pack.ts none      no pack (pure BYOK demo) — just strip packs/
 *   --keep-machinery                     leave packs/ + this script in place (template CI smoke)
 *
 * pack.json shape:
 *   {
 *     "name": "eve",
 *     "description": "…",
 *     "remove": ["src/app/api/run", …],            // paths deleted from the repo
 *     "dependencies": { "add": {…}, "remove": [] }, // package.json deps
 *     "packageJson": { "imports": {…}, "overrides": {…}, "scripts": {…} }, // merged verbatim
 *     "postNotes": "…"                              // printed after apply
 *   }
 * Files under packs/<pack>/files/ are copied onto the repo root (overwrite).
 */

import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KEEP = process.argv.includes("--keep-machinery");
const packName = process.argv[2];

if (!packName || packName.startsWith("--")) {
	const available = existsSync(join(ROOT, "packs"))
		? readdirSync(join(ROOT, "packs")).filter((d) =>
				existsSync(join(ROOT, "packs", d, "pack.json")),
			)
		: [];
	console.error(`Usage: bun scripts/apply-pack.ts <pack>|none [--keep-machinery]`);
	console.error(`Available packs: ${available.join(", ") || "(none)"}`);
	process.exit(1);
}

function stripMachinery() {
	if (KEEP) return;
	rmSync(join(ROOT, "packs"), { recursive: true, force: true });
	rmSync(join(ROOT, "scripts", "apply-pack.ts"), { force: true });
	const scriptsDir = join(ROOT, "scripts");
	if (existsSync(scriptsDir) && readdirSync(scriptsDir).length === 0)
		rmSync(scriptsDir, { recursive: true });
}

if (packName === "none") {
	stripMachinery();
	console.log("No pack applied. packs/ machinery removed — pure BYOK template remains.");
	process.exit(0);
}

const packDir = join(ROOT, "packs", packName);
const manifestPath = join(packDir, "pack.json");
if (!existsSync(manifestPath)) {
	console.error(`Pack "${packName}" not found (${manifestPath} missing).`);
	process.exit(1);
}

type Manifest = {
	name: string;
	description?: string;
	remove?: string[];
	dependencies?: { add?: Record<string, string>; remove?: string[] };
	packageJson?: Record<string, unknown>;
	postNotes?: string;
};
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;

for (const rel of manifest.remove ?? []) {
	rmSync(join(ROOT, rel), { recursive: true, force: true });
	console.log(`- removed ${rel}`);
}

const filesDir = join(packDir, "files");
if (existsSync(filesDir)) {
	const walk = (dir: string): string[] =>
		readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
			e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
		);
	for (const abs of walk(filesDir)) {
		const rel = abs.slice(filesDir.length + 1);
		const dest = join(ROOT, rel);
		mkdirSync(dirname(dest), { recursive: true });
		cpSync(abs, dest);
		console.log(`+ ${rel}`);
	}
}

const pkgPath = join(ROOT, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
for (const dep of manifest.dependencies?.remove ?? []) {
	delete pkg.dependencies?.[dep];
	delete pkg.devDependencies?.[dep];
}
pkg.dependencies = { ...pkg.dependencies, ...(manifest.dependencies?.add ?? {}) };
for (const [key, value] of Object.entries(manifest.packageJson ?? {})) {
	pkg[key] =
		typeof value === "object" && value !== null && !Array.isArray(value)
			? { ...(pkg[key] as Record<string, unknown>), ...value }
			: value;
}
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`);
console.log("~ package.json patched");

stripMachinery();
console.log(`\nPack "${manifest.name}" applied. Now run: bun install`);
if (manifest.postNotes) console.log(`\n${manifest.postNotes}`);
