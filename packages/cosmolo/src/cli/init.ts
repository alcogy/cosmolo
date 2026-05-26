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

function collectFiles(dir: string): Array<[string, string]> {
	const results: Array<[string, string]> = [];
	function walk(current: string) {
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const full = path.join(current, entry.name);
			if (entry.isDirectory()) walk(full);
			else results.push([full, path.relative(dir, full)]);
		}
	}
	walk(dir);
	return results;
}

function destPath(relativePath: string, projectRoot: string): string {
	const mapped = relativePath
		.replace(/^routes\//, 'src/routes/')
		.replace(/^lib\//, 'src/lib/');
	return path.join(projectRoot, mapped);
}

function injectPackageScripts(projectRoot: string): void {
	const pkgPath = path.join(projectRoot, 'package.json');
	if (!fs.existsSync(pkgPath)) return;

	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
	pkg.scripts = pkg.scripts ?? {};

	let added = false;
	const scripts: Record<string, string> = {
		'generate:article':  'cosmolo generate article',
		'generate:page':     'cosmolo generate page',
		'generate:category': 'cosmolo generate category',
	};
	for (const [key, val] of Object.entries(scripts)) {
		if (!pkg.scripts[key]) {
			pkg.scripts[key] = val;
			added = true;
		}
	}

	if (added) {
		fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
		console.log('  updated  package.json (added generate:* scripts)');
	}
}

// ─── main ─────────────────────────────────────────────────────────────────────

export async function main(): Promise<void> {
	const PROJECT_ROOT = process.cwd();
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

	console.log('\ncosmolo init\n');

	// ── Mode selection ──────────────────────────────────────────────────────
	console.log('Choose an initialization mode:\n');
	console.log('  1) Full  — server routes + Svelte page components');
	console.log('  2) Slim  — server routes only (bring your own Svelte UI)\n');

	let modeRaw = '';
	while (!['1', '2'].includes(modeRaw)) {
		modeRaw = (await ask(rl, 'Mode [1/2]: ')).trim();
		if (!['1', '2'].includes(modeRaw)) console.log('  Please enter 1 or 2.');
	}
	const mode: 'full' | 'slim' = modeRaw === '1' ? 'full' : 'slim';

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

	// ── Collect files ───────────────────────────────────────────────────────
	const sharedFiles = collectFiles(path.join(TEMPLATE_DIR, 'shared'));
	const fullFiles = mode === 'full' ? collectFiles(path.join(TEMPLATE_DIR, 'full')) : [];

	const allFiles: Array<[string, string]> = [
		...sharedFiles.map(([src, rel]) => [src, rel] as [string, string]),
		...fullFiles.map(([src, rel]) => [src, rel] as [string, string]),
	];

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
		console.log('\nThe following files already exist:\n');
		for (const f of conflicts) console.log(`  ${f}`);

		let overwriteRaw = '';
		while (!['y', 'n'].includes(overwriteRaw)) {
			overwriteRaw = (await ask(rl, '\nOverwrite all? [y/N]: ')).trim().toLowerCase() || 'n';
			if (!['y', 'n'].includes(overwriteRaw)) console.log('  Please enter y or n.');
		}

		if (overwriteRaw === 'n') {
			console.log('\nAborted. No files were written.\n');
			rl.close();
			process.exit(0);
		}
	}

	rl.close();

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

	injectPackageScripts(PROJECT_ROOT);

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
