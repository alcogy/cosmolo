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

function readProjectName(projectRoot: string): string {
	const pkgPath = path.join(projectRoot, 'package.json');
	if (fs.existsSync(pkgPath)) {
		try {
			const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
			if (typeof pkg.name === 'string' && pkg.name) return pkg.name;
		} catch {
			// fall through
		}
	}
	return 'my-cosmolo-site';
}

function injectPackageScripts(
	projectRoot: string,
	adapter: 'ssg' | 'cloudflare' | 'serverless'
): void {
	const pkgPath = path.join(projectRoot, 'package.json');
	if (!fs.existsSync(pkgPath)) return;

	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
	pkg.scripts = pkg.scripts ?? {};
	pkg.dependencies = pkg.dependencies ?? {};

	let added = false;
	const scripts: Record<string, string> = {
		'generate:article':  'cosmolo generate article',
		'generate:page':     'cosmolo generate page',
		'generate:category': 'cosmolo generate category',
	};
	if (adapter === 'cloudflare') {
		scripts['deploy'] = 'bun run build && bunx wrangler pages deploy .svelte-kit/cloudflare';
	}
	for (const [key, val] of Object.entries(scripts)) {
		if (!pkg.scripts[key]) {
			pkg.scripts[key] = val;
			added = true;
		}
	}

	if (!pkg.dependencies['cosmolo']) {
		pkg.dependencies['cosmolo'] = 'latest';
		added = true;
	}

	if (added) {
		fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
		console.log('  updated  package.json (added cosmolo dependency + generate:* scripts)');
	}
}

function svelteConfigContent(adapter: 'ssg' | 'cloudflare'): string {
	const pkg = adapter === 'ssg' ? '@sveltejs/adapter-static' : '@sveltejs/adapter-cloudflare';
	return (
		`import adapter from '${pkg}';\n` +
		`import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';\n\n` +
		`/** @type {import('@sveltejs/kit').Config} */\n` +
		`const config = {\n` +
		`\tpreprocess: vitePreprocess(),\n` +
		`\tkit: {\n` +
		`\t\tadapter: adapter(),\n` +
		`\t},\n` +
		`};\n\n` +
		`export default config;\n`
	);
}

function githubActionsContent(projectName: string): string {
	return (
		`name: Deploy to Cloudflare Pages\n\n` +
		`on:\n` +
		`  push:\n` +
		`    branches: [main]\n\n` +
		`jobs:\n` +
		`  deploy:\n` +
		`    runs-on: ubuntu-latest\n` +
		`    permissions:\n` +
		`      contents: read\n` +
		`      deployments: write\n` +
		`    steps:\n` +
		`      - uses: actions/checkout@v4\n` +
		`      - uses: oven-sh/setup-bun@v2\n` +
		`      - run: bun install --frozen-lockfile\n` +
		`      - run: bun run build\n` +
		`      - uses: cloudflare/wrangler-action@v3\n` +
		`        with:\n` +
		`          apiToken: \${{ secrets.CF_API_TOKEN }}\n` +
		`          command: pages deploy .svelte-kit/cloudflare --project-name=${projectName}\n`
	);
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
	console.log('  1) SSG         — @sveltejs/adapter-static (GitHub Pages, Cloudflare Pages static, etc.)');
	console.log('  2) Cloudflare  — @sveltejs/adapter-cloudflare (Workers / Pages SSR)');
	console.log('  3) Serverless  — Vercel, Node, etc.\n');

	let adapterRaw = '';
	while (!['1', '2', '3'].includes(adapterRaw)) {
		adapterRaw = (await ask(rl, 'Adapter [1/2/3]: ')).trim();
		if (!['1', '2', '3'].includes(adapterRaw)) console.log('  Please enter 1, 2, or 3.');
	}
	const adapter: 'ssg' | 'cloudflare' | 'serverless' =
		adapterRaw === '1' ? 'ssg' : adapterRaw === '2' ? 'cloudflare' : 'serverless';

	// ── Collect files ───────────────────────────────────────────────────────
	const sharedFiles = collectFiles(path.join(TEMPLATE_DIR, 'shared'));
	const fullFiles = mode === 'full' ? collectFiles(path.join(TEMPLATE_DIR, 'full')) : [];

	const allFiles: Array<[string, string]> = [
		...sharedFiles.map(([src, rel]) => [src, rel] as [string, string]),
		...fullFiles.map(([src, rel]) => [src, rel] as [string, string]),
	];

	const layoutTsPath = path.join(PROJECT_ROOT, 'src/routes/+layout.ts');
	const layoutTsContent = 'export const prerender = true;\n';

	const wranglerTomlPath = path.join(PROJECT_ROOT, 'wrangler.toml');
	const appDtsPath = path.join(PROJECT_ROOT, 'src/app.d.ts');
	const svelteConfigPath = path.join(PROJECT_ROOT, 'svelte.config.js');
	const ghaWorkflowPath = path.join(PROJECT_ROOT, '.github', 'workflows', 'deploy.yml');

	// ── GitHub Actions prompt (Cloudflare only, before conflict detection) ──
	let generateGha = false;
	if (adapter === 'cloudflare') {
		const ans = (await ask(rl, '\nGenerate GitHub Actions deploy workflow? [y/N]: ')).toLowerCase();
		generateGha = ans === 'y';
	}

	// ── Conflict detection ──────────────────────────────────────────────────
	const conflicts: string[] = [];

	for (const [, rel] of allFiles) {
		const dest = destPath(rel, PROJECT_ROOT);
		if (fs.existsSync(dest)) conflicts.push(path.relative(PROJECT_ROOT, dest));
	}
	if (adapter === 'ssg') {
		if (fs.existsSync(layoutTsPath)) conflicts.push(path.relative(PROJECT_ROOT, layoutTsPath));
		if (fs.existsSync(svelteConfigPath)) conflicts.push('svelte.config.js');
	}
	if (adapter === 'cloudflare') {
		if (fs.existsSync(wranglerTomlPath)) conflicts.push('wrangler.toml');
		if (fs.existsSync(appDtsPath)) conflicts.push('src/app.d.ts');
		if (fs.existsSync(svelteConfigPath)) conflicts.push('svelte.config.js');
		if (generateGha && fs.existsSync(ghaWorkflowPath)) conflicts.push('.github/workflows/deploy.yml');
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

	if (adapter === 'ssg') {
		writeFile(layoutTsPath, layoutTsContent);
		console.log(`  created  src/routes/+layout.ts`);
		writeFile(svelteConfigPath, svelteConfigContent('ssg'));
		console.log(`  created  svelte.config.js`);
	}

	if (adapter === 'cloudflare') {
		writeFile(svelteConfigPath, svelteConfigContent('cloudflare'));
		console.log(`  created  svelte.config.js`);

		const projectName = readProjectName(PROJECT_ROOT);
		const wranglerToml = [
			`name = "${projectName}"`,
			`compatibility_date = "${new Date().toISOString().slice(0, 10)}"`,
			`compatibility_flags = ["nodejs_compat"]`,
			``,
			`# Uncomment to add Cloudflare D1 (run: bunx cosmolo migrate:db)`,
			`# [[d1_databases]]`,
			`# binding = "DB"`,
			`# database_name = "${projectName}-db"`,
			`# database_id   = ""  # fill in after: bunx wrangler d1 create ${projectName}-db`,
		].join('\n') + '\n';
		writeFile(wranglerTomlPath, wranglerToml);
		console.log(`  created  wrangler.toml`);

		const appDts = [
			`// See https://svelte.dev/docs/kit/types#app.d.ts`,
			`// Install @cloudflare/workers-types for full type support:`,
			`//   bun add -D @cloudflare/workers-types`,
			`declare global {`,
			`\tnamespace App {`,
			`\t\tinterface Platform {`,
			`\t\t\tenv: Env;`,
			`\t\t\tcf: CfProperties;`,
			`\t\t\tctx: ExecutionContext;`,
			`\t\t}`,
			`\t}`,
			`}`,
			``,
			`export {};`,
		].join('\n') + '\n';
		writeFile(appDtsPath, appDts);
		console.log(`  created  src/app.d.ts`);

		if (generateGha) {
			writeFile(ghaWorkflowPath, githubActionsContent(projectName));
			console.log(`  created  .github/workflows/deploy.yml`);
		}
	}

	injectPackageScripts(PROJECT_ROOT, adapter);

	// ── Next steps ──────────────────────────────────────────────────────────
	console.log('\nDone! Next steps:\n');
	console.log('  1. Run:              bun install');
	if (adapter === 'ssg') {
		console.log('  2. Install adapter:  bun add -D @sveltejs/adapter-static');
		if (mode === 'full') {
			console.log('  3. Install sass:     bun add -D sass  (SCSS used in Svelte templates)');
			console.log('  4. Run:              bun dev');
		} else {
			console.log('  3. Add your own +page.svelte files for each route.');
			console.log('  4. Run:              bun dev');
		}
	} else if (adapter === 'cloudflare') {
		console.log('  2. Install adapter:  bun add -D @sveltejs/adapter-cloudflare');
		console.log('  3. Install types:    bun add -D @cloudflare/workers-types');
		if (generateGha) {
			console.log('  4. Add secret to GitHub repo:  CF_API_TOKEN  (Cloudflare API token)');
			if (mode === 'full') {
				console.log('  5. Install sass:     bun add -D sass  (SCSS used in Svelte templates)');
				console.log('  6. Push to main — GitHub Actions will build and deploy automatically.');
			} else {
				console.log('  5. Add your own +page.svelte files for each route.');
				console.log('  6. Push to main — GitHub Actions will build and deploy automatically.');
			}
		} else {
			if (mode === 'full') {
				console.log('  4. Install sass:     bun add -D sass  (SCSS used in Svelte templates)');
				console.log('  5. Run:              bunx wrangler dev  (or bun dev for local Vite)');
				console.log('  6. Deploy:           bun run deploy');
			} else {
				console.log('  4. Add your own +page.svelte files for each route.');
				console.log('  5. Run:              bunx wrangler dev  (or bun dev for local Vite)');
				console.log('  6. Deploy:           bun run deploy');
			}
		}
	} else {
		console.log('  2. Install adapter:  bun add -D @sveltejs/adapter-vercel  (or your adapter)');
		if (mode === 'full') {
			console.log('  3. Install sass:     bun add -D sass  (SCSS used in Svelte templates)');
			console.log('  4. Run:              bun dev');
		} else {
			console.log('  3. Add your own +page.svelte files for each route.');
			console.log('  4. Run:              bun dev');
		}
	}
	console.log('\n  See https://github.com/alcogy/cosmolo for full documentation.\n');
}
