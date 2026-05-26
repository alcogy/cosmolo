#!/usr/bin/env bun
/**
 * Cosmolo project scaffolding.
 * Usage:
 *   bunx create-cosmolo           — interactive setup in current directory
 *   bunx create-cosmolo my-site   — scaffold into ./my-site
 *
 * Requires git to be installed.
 */
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const REPO = 'https://github.com/alcogy/cosmolo.git';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string, fallback = ''): Promise<string> {
	const hint = fallback ? ` [${fallback}]` : '';
	return new Promise(resolve =>
		rl.question(`  ${question}${hint}: `, ans => resolve(ans.trim() || fallback))
	);
}

function run(cmd: string, cwd: string): void {
	execSync(cmd, { stdio: 'inherit', cwd });
}

async function main(): Promise<void> {
	console.log('Cosmolo — New Project\n');

	// Target directory
	const defaultDir = process.argv[2] || 'my-cosmolo-site';
	const dir = await ask('Project directory', defaultDir);
	const absDir = path.resolve(dir);

	if (fs.existsSync(absDir)) {
		console.error(`\nError: "${dir}" already exists.`);
		process.exit(1);
	}

	// Site info
	const siteName    = await ask('Site name', 'My Site');
	const siteUrl     = await ask('Site URL', 'https://example.com');
	const twitter     = await ask('Twitter handle (optional)', '');
	const catsRaw     = await ask('Starter categories (comma-separated)', 'tech');
	const catKeys     = catsRaw.split(',').map(s => s.trim()).filter(Boolean);

	rl.close();

	// Clone
	console.log(`\nCloning Cosmolo into ${dir}...`);
	run(`git clone --depth=1 ${REPO} "${absDir}"`, process.cwd());

	// Remove upstream git history
	fs.rmSync(path.join(absDir, '.git'), { recursive: true, force: true });

	// Update config/site.json
	const siteConfigPath = path.join(absDir, 'config/site.json');
	const siteConfig = JSON.parse(fs.readFileSync(siteConfigPath, 'utf-8'));
	siteConfig.name = siteName;
	siteConfig.url  = siteUrl;
	if (twitter) siteConfig.twitterHandle = twitter;
	fs.writeFileSync(siteConfigPath, JSON.stringify(siteConfig, null, '\t') + '\n');

	// Update config/categories.json
	const categoriesPath = path.join(absDir, 'config/categories.json');
	const categories: Record<string, { label: string; description: string }> = {};
	for (const key of catKeys) {
		const label = key.charAt(0).toUpperCase() + key.slice(1);
		categories[key] = { label, description: '' };
	}
	fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, '\t') + '\n');

	// Install dependencies
	console.log('\nInstalling dependencies...');
	run('bun install', absDir);

	// Init fresh git repo
	run('git init', absDir);
	run('git add -A', absDir);
	run('git commit -m "init: scaffold from Cosmolo"', absDir);

	console.log(`
Done! Your new Cosmolo site is ready.

  cd ${dir}
  bun dev

Edit config/site.json and config/categories.json to customize your site.`);
}

main().catch(err => {
	console.error(err);
	rl.close();
	process.exit(1);
});
