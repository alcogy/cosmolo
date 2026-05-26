import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_CONFIG } from '../config.js';
import type { ResolvedCosmoloConfig } from '../types.js';

// ─── config ──────────────────────────────────────────────────────────────────

async function loadConfig(): Promise<ResolvedCosmoloConfig> {
	const root = process.cwd();
	for (const name of ['cosmolo.config.ts', 'cosmolo.config.js']) {
		const p = path.join(root, name);
		if (fs.existsSync(p)) {
			try {
				const mod = await import(p);
				return mod.default as ResolvedCosmoloConfig;
			} catch {
				// fall through to defaults
			}
		}
	}
	return DEFAULT_CONFIG;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function ask(rl: readline.Interface, question: string, fallback = ''): Promise<string> {
	const hint = fallback ? ` [${fallback}]` : '';
	return new Promise((resolve) =>
		rl.question(`  ${question}${hint}: `, (ans) => resolve(ans.trim() || fallback))
	);
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.trim()
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-');
}

function today(): string {
	return new Date().toISOString().split('T')[0];
}

function readCategories(config: ResolvedCosmoloConfig): Record<string, { label: string; description: string }> {
	const p = path.resolve(process.cwd(), config.categoriesConfigPath);
	if (!fs.existsSync(p)) return {};
	return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// ─── generators ──────────────────────────────────────────────────────────────

async function generateArticle(rl: readline.Interface, config: ResolvedCosmoloConfig): Promise<void> {
	console.log('\nGenerate Article\n');

	const title = await ask(rl, 'Title');
	if (!title) { console.error('\nError: Title is required.'); process.exit(1); }

	const defaultSlug = slugify(title);
	const slug = await ask(rl, 'Slug', defaultSlug);

	const articlesDir = path.resolve(process.cwd(), config.articlesDir);
	const filePath = path.join(articlesDir, `${slug}.md`);

	if (fs.existsSync(filePath)) {
		console.error(`\nError: ${config.articlesDir}/${slug}.md already exists.`);
		process.exit(1);
	}

	const categories = readCategories(config);
	const catKeys = Object.keys(categories);
	if (catKeys.length > 0) console.log(`\n  Categories: ${catKeys.join(', ')}`);

	const category    = await ask(rl, 'Category', catKeys[0] ?? 'other');
	const excerpt     = await ask(rl, 'Excerpt', '');
	const tagsRaw     = await ask(rl, 'Tags (comma-separated)', '');
	const tags        = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
	const sort        = await ask(rl, 'Sort', '0');
	const date        = await ask(rl, 'Date', today());
	const draftAns    = await ask(rl, 'Draft? (y/N)', 'N');
	const draft       = draftAns.toLowerCase() === 'y';
	const series      = await ask(rl, 'Series (optional)', '');
	const seriesOrder = series ? await ask(rl, 'Series order', '1') : '';

	const lines = [
		'---',
		`title: "${title}"`,
		`category: "${category}"`,
		`excerpt: "${excerpt}"`,
		`sort: ${parseInt(sort, 10) || 0}`,
		`date: "${date}"`,
	];
	if (tags.length > 0) lines.push(`tags: [${tags.map((t) => `"${t}"`).join(', ')}]`);
	if (series) {
		lines.push(`series: "${series}"`);
		lines.push(`seriesOrder: ${parseInt(seriesOrder, 10) || 1}`);
	}
	if (draft) lines.push('draft: true');
	lines.push('---', '', '');

	fs.mkdirSync(articlesDir, { recursive: true });
	fs.writeFileSync(filePath, lines.join('\n'));
	console.log(`\nCreated: ${config.articlesDir}/${slug}.md`);
}

async function generatePage(rl: readline.Interface, config: ResolvedCosmoloConfig): Promise<void> {
	console.log('\nGenerate Page\n');

	const title = await ask(rl, 'Title');
	if (!title) { console.error('\nError: Title is required.'); process.exit(1); }

	const defaultSlug = slugify(title);
	const slug = await ask(rl, 'Slug', defaultSlug);

	const pagesDir = path.resolve(process.cwd(), config.pagesDir);
	const filePath = path.join(pagesDir, `${slug}.md`);

	if (fs.existsSync(filePath)) {
		console.error(`\nError: ${config.pagesDir}/${slug}.md already exists.`);
		process.exit(1);
	}

	const content = ['---', `title: "${title}"`, '---', '', ''].join('\n');
	fs.mkdirSync(pagesDir, { recursive: true });
	fs.writeFileSync(filePath, content);
	console.log(`\nCreated: ${config.pagesDir}/${slug}.md`);
}

async function generateCategory(rl: readline.Interface, config: ResolvedCosmoloConfig): Promise<void> {
	console.log('\nGenerate Category\n');

	const key = await ask(rl, 'Key (slug)');
	if (!key) { console.error('\nError: Key is required.'); process.exit(1); }

	const categoriesPath = path.resolve(process.cwd(), config.categoriesConfigPath);
	const categories = readCategories(config);

	if (categories[key]) {
		console.error(`\nError: Category "${key}" already exists.`);
		process.exit(1);
	}

	const label       = await ask(rl, 'Label');
	const description = await ask(rl, 'Description', '');

	categories[key] = { label, description };
	fs.mkdirSync(path.dirname(categoriesPath), { recursive: true });
	fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, '\t') + '\n');
	console.log(`\nAdded: "${key}" to ${config.categoriesConfigPath}`);
}

// ─── main ─────────────────────────────────────────────────────────────────────

export async function main(): Promise<void> {
	const config = await loadConfig();
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

	const subcommand = process.argv[3]; // argv[2] is "generate"

	const commands: Record<string, (rl: readline.Interface, config: ResolvedCosmoloConfig) => Promise<void>> = {
		article:  generateArticle,
		page:     generatePage,
		category: generateCategory,
	};

	try {
		if (subcommand && commands[subcommand]) {
			await commands[subcommand](rl, config);
		} else if (subcommand) {
			console.error(`Unknown subcommand: ${subcommand}`);
			console.error('Available: article, page, category');
			process.exit(1);
		} else {
			console.log('Cosmolo Generator\n');
			console.log('  1. Article');
			console.log('  2. Page');
			console.log('  3. Category');
			const choice = await new Promise<string>((resolve) =>
				rl.question('\nWhat would you like to generate? (1/2/3): ', (ans) => resolve(ans.trim()))
			);
			const picked = ({ '1': generateArticle, '2': generatePage, '3': generateCategory } as Record<string, typeof generateArticle>)[choice];
			if (!picked) { console.error('Invalid choice.'); process.exit(1); }
			await picked(rl, config);
		}
	} finally {
		rl.close();
	}
}
