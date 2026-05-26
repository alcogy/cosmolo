#!/usr/bin/env bun
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

// ─── helpers ─────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.resolve(__dirname, '../../templates');

function ask(rl: readline.Interface, question: string): Promise<string> {
	return new Promise((resolve) => rl.question(question, resolve));
}

function copyFile(src: string, dest: string): void {
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.copyFileSync(src, dest);
}

function writeFile(dest: string, content: string): void {
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.writeFileSync(dest, content, 'utf-8');
}

/** Recursively collect all files under a directory. Returns [srcPath, relativePath] pairs. */
function collectFiles(dir: string): Array<[string, string]> {
	const results: Array<[string, string]> = [];
	function walk(current: string) {
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const full = path.join(current, entry.name);
			if (entry.isDirectory()) {
				walk(full);
			} else {
				results.push([full, path.relative(dir, full)]);
			}
		}
	}
	walk(dir);
	return results;
}

/** Map template relative path → project destination path. */
function destPath(relativePath: string, projectRoot: string): string {
	const mapped = relativePath
		.replace(/^routes\//, 'src/routes/')
		.replace(/^lib\//, 'src/lib/');
	return path.join(projectRoot, mapped);
}

// ─── main ────────────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.cwd();

async function main() {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

	console.log('\ncosmolo init\n');

	// ── Mode selection ──────────────────────────────────────────────────────
	console.log('Choose an initialization mode:\n');
	console.log('  A) Full  — server routes + Svelte page components');
	console.log('  B) Slim  — server routes only (bring your own Svelte UI)\n');

	let modeRaw = '';
	while (!['a', 'b'].includes(modeRaw)) {
		modeRaw = (await ask(rl, 'Mode [A/B]: ')).trim().toLowerCase();
		if (!['a', 'b'].includes(modeRaw)) console.log('  Please enter A or B.');
	}
	const mode: 'full' | 'slim' = modeRaw === 'a' ? 'full' : 'slim';

	// ── Adapter selection ───────────────────────────────────────────────────
	console.log('\nChoose your deployment adapter:\n');
	console.log('  1) SSG              — @sveltejs/adapter-static (Cloudflare Pages static, GitHub Pages, etc.)');
	console.log('  2) Serverless/SSR   — Cloudflare Workers, Vercel, Node, etc.\n');

	let adapterRaw = '';
	while (!['1', '2'].includes(adapterRaw)) {
		adapterRaw = (await ask(rl, 'Adapter [1/2]: ')).trim();
		if (!['1', '2'].includes(adapterRaw)) console.log('  Please enter 1 or 2.');
	}
	const isSSG = adapterRaw === '1';

	rl.close();

	// ── Collect files ───────────────────────────────────────────────────────
	const sharedFiles = collectFiles(path.join(TEMPLATE_DIR, 'shared'));
	const fullFiles = mode === 'full' ? collectFiles(path.join(TEMPLATE_DIR, 'full')) : [];

	const allFiles: Array<[string, string]> = [
		...sharedFiles.map(([src, rel]) => [src, rel] as [string, string]),
		...fullFiles.map(([src, rel]) => [src, rel] as [string, string]),
	];

	// SSG: also generate src/routes/+layout.ts
	const layoutTsPath = path.join(PROJECT_ROOT, 'src/routes/+layout.ts');
	const layoutTsContent = 'export const prerender = true;\n';

	// ── Conflict detection ──────────────────────────────────────────────────
	const conflicts: string[] = [];

	for (const [, rel] of allFiles) {
		const dest = destPath(rel, PROJECT_ROOT);
		if (fs.existsSync(dest)) conflicts.push(path.relative(PROJECT_ROOT, dest));
	}

	if (isSSG && fs.existsSync(layoutTsPath)) {
		conflicts.push(path.relative(PROJECT_ROOT, layoutTsPath));
	}

	if (conflicts.length > 0) {
		console.error('\nError: The following files already exist and would be overwritten:\n');
		for (const f of conflicts) console.error(`  ${f}`);
		console.error('\nTo resolve, either:');
		console.error('  1. Remove or rename the conflicting files, then run cosmolo init again.');
		console.error('  2. Manually copy the needed templates from the cosmolo package:');
		console.error(`     node_modules/cosmolo/templates/shared/`);
		if (mode === 'full') console.error(`     node_modules/cosmolo/templates/full/`);
		if (isSSG) {
			console.error('\n  For SSG prerendering, add this to src/routes/+layout.ts manually:');
			console.error("     export const prerender = true;");
		}
		process.exit(1);
	}

	// ── Write files ─────────────────────────────────────────────────────────
	for (const [src, rel] of allFiles) {
		const dest = destPath(rel, PROJECT_ROOT);
		copyFile(src, dest);
		console.log(`  created  ${path.relative(PROJECT_ROOT, dest)}`);
	}

	if (isSSG) {
		writeFile(layoutTsPath, layoutTsContent);
		console.log(`  created  src/routes/+layout.ts`);
	}

	// ── Next steps ──────────────────────────────────────────────────────────
	console.log('\nDone! Next steps:\n');
	console.log('  1. Install cosmolo:  npm install cosmolo  (or bun add cosmolo)');
	if (isSSG) {
		console.log('  2. Install adapter:  npm install -D @sveltejs/adapter-static');
	} else {
		console.log('  2. Install adapter:  npm install -D @sveltejs/adapter-cloudflare  (or your adapter)');
	}
	if (mode === 'full') {
		console.log('  3. Install sass:     npm install -D sass  (SCSS used in Svelte templates)');
		console.log('  4. Run:              npm run dev');
	} else {
		console.log('  3. Add your own +page.svelte files for each route.');
		console.log('  4. Run:              npm run dev');
	}
	console.log('\n  See https://github.com/alcogy/cosmolo for full documentation.\n');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
