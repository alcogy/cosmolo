import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

function ask(rl: readline.Interface, question: string, fallback = ''): Promise<string> {
	const hint = fallback ? ` [${fallback}]` : '';
	return new Promise((resolve) =>
		rl.question(`  ${question}${hint}: `, (ans) => resolve(ans.trim() || fallback))
	);
}

function r2HelperContent(): string {
	return (
		`// Helper for serving assets stored in Cloudflare R2.\n` +
		`// Usage: import in a +server.ts route and call getR2Asset.\n\n` +
		`export async function getR2Asset(bucket: R2Bucket, key: string): Promise<Response> {\n` +
		`  const obj = await bucket.get(key);\n` +
		`  if (!obj) return new Response('Not found', { status: 404 });\n` +
		`  const headers = new Headers();\n` +
		`  obj.writeHttpMetadata(headers);\n` +
		`  headers.set('etag', obj.httpEtag);\n` +
		`  headers.set('cache-control', 'public, max-age=31536000, immutable');\n` +
		`  return new Response(obj.body as ReadableStream, { headers });\n` +
		`}\n`
	);
}

function r2RouteContent(binding: string): string {
	return (
		`import type { RequestHandler } from './$types';\n` +
		`import { getR2Asset } from '$lib/r2';\n\n` +
		`export const GET: RequestHandler = async ({ params, platform }) => {\n` +
		`  return getR2Asset(platform!.env.${binding}, params.key);\n` +
		`};\n`
	);
}

function appendR2Binding(wranglerPath: string, binding: string, bucketName: string): void {
	const existing = fs.readFileSync(wranglerPath, 'utf-8');
	const section =
		`\n[[r2_buckets]]\n` +
		`binding = "${binding}"\n` +
		`bucket_name = "${bucketName}"\n`;
	fs.writeFileSync(wranglerPath, existing + section);
}

export async function main(): Promise<void> {
	const root = process.cwd();
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

	console.log('\ncosmolo setup:r2\n');

	// wrangler.toml check
	const wranglerPath = path.join(root, 'wrangler.toml');
	if (!fs.existsSync(wranglerPath)) {
		console.error(
			'  wrangler.toml not found.\n' +
			'  Run `cosmolo init` with the Cloudflare adapter first.\n'
		);
		rl.close();
		process.exit(1);
	}

	const bucketName = await ask(rl, 'R2 bucket name', 'assets');
	const binding = await ask(rl, 'Binding name (used in platform.env.*)', 'ASSETS');

	// Conflict checks
	const helperPath = path.join(root, 'src', 'lib', 'r2.ts');
	const routePath = path.join(root, 'src', 'routes', 'assets', '[...key]', '+server.ts');
	const conflicts: string[] = [];
	if (fs.existsSync(helperPath)) conflicts.push('src/lib/r2.ts');
	if (fs.existsSync(routePath)) conflicts.push('src/routes/assets/[...key]/+server.ts');

	if (conflicts.length > 0) {
		console.log('\n  The following files already exist:');
		for (const f of conflicts) console.log(`    ${f}`);
		const ans = await new Promise<string>((resolve) =>
			rl.question('\n  Overwrite? [y/N]: ', (a) => resolve(a.trim().toLowerCase() || 'n'))
		);
		if (ans !== 'y') {
			console.log('\n  Aborted. No files were written.\n');
			rl.close();
			process.exit(0);
		}
	}

	rl.close();

	// Write helper
	fs.mkdirSync(path.dirname(helperPath), { recursive: true });
	fs.writeFileSync(helperPath, r2HelperContent());

	// Write route
	fs.mkdirSync(path.dirname(routePath), { recursive: true });
	fs.writeFileSync(routePath, r2RouteContent(binding));

	// Update wrangler.toml
	appendR2Binding(wranglerPath, binding, bucketName);

	console.log('\n✓ Files generated:');
	console.log('  src/lib/r2.ts');
	console.log('  src/routes/assets/[...key]/+server.ts');
	console.log('  wrangler.toml  (r2_buckets appended)');

	console.log('\nNext steps:\n');
	console.log(`  1. Create the R2 bucket (if not done yet):`);
	console.log(`       bunx wrangler r2 bucket create ${bucketName}\n`);
	console.log(`  2. Add the binding to src/app.d.ts:`);
	console.log(`       interface Platform { env: { ${binding}: R2Bucket } }\n`);
	console.log(`  3. Upload assets (e.g. from static/images/):`);
	console.log(`       bunx wrangler r2 object put ${bucketName}/<key> --file <path>\n`);
	console.log(`  4. Reference assets via /assets/<key> in your templates.\n`);
	console.log(`  See https://developers.cloudflare.com/r2/ for full R2 docs.`);
}
