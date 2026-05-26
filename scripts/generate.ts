#!/usr/bin/env bun
/**
 * Cosmolo in-project generator.
 * Usage:
 *   bun run generate              — interactive menu
 *   bun run generate article      — create an article
 *   bun run generate page         — create a static page
 *   bun run generate category     — add a category
 */
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string, fallback = ''): Promise<string> {
	const hint = fallback ? ` [${fallback}]` : '';
	return new Promise(resolve =>
		rl.question(`  ${question}${hint}: `, ans => resolve(ans.trim() || fallback))
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

function readCategories(): Record<string, { label: string; description: string }> {
	const p = path.join(ROOT, 'config/categories.json');
	return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// ─── Article ──────────────────────────────────────────────────────────────────

async function generateArticle(): Promise<void> {
	console.log('\nGenerate Article\n');

	const title = await ask('Title');
	if (!title) { console.error('\nError: Title is required.'); process.exit(1); }

	const defaultSlug = slugify(title);
	const slug = await ask('Slug', defaultSlug);

	const filePath = path.join(ROOT, 'src/content/articles', `${slug}.md`);
	if (fs.existsSync(filePath)) {
		console.error(`\nError: src/content/articles/${slug}.md already exists.`);
		process.exit(1);
	}

	const categories = readCategories();
	const catKeys = Object.keys(categories);
	if (catKeys.length > 0) {
		console.log(`\n  Categories: ${catKeys.join(', ')}`);
	}

	const category = await ask('Category', catKeys[0] ?? 'other');
	const excerpt  = await ask('Excerpt', '');
	const tagsRaw  = await ask('Tags (comma-separated)', '');
	const tags     = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
	const sort     = await ask('Sort', '0');
	const date     = await ask('Date', today());
	const draftAns = await ask('Draft? (y/N)', 'N');
	const draft    = draftAns.toLowerCase() === 'y';
	const series   = await ask('Series (optional)', '');
	const seriesOrder = series ? await ask('Series order', '1') : '';

	const lines = [
		'---',
		`title: "${title}"`,
		`category: "${category}"`,
		`excerpt: "${excerpt}"`,
		`sort: ${parseInt(sort, 10) || 0}`,
		`date: "${date}"`,
	];
	if (tags.length > 0) lines.push(`tags: [${tags.map(t => `"${t}"`).join(', ')}]`);
	if (series) {
		lines.push(`series: "${series}"`);
		lines.push(`seriesOrder: ${parseInt(seriesOrder, 10) || 1}`);
	}
	if (draft) lines.push('draft: true');
	lines.push('---', '', '');

	fs.writeFileSync(filePath, lines.join('\n'));
	console.log(`\nCreated: src/content/articles/${slug}.md`);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

async function generatePage(): Promise<void> {
	console.log('\nGenerate Page\n');

	const title = await ask('Title');
	if (!title) { console.error('\nError: Title is required.'); process.exit(1); }

	const defaultSlug = slugify(title);
	const slug = await ask('Slug', defaultSlug);

	const filePath = path.join(ROOT, 'src/content/pages', `${slug}.md`);
	if (fs.existsSync(filePath)) {
		console.error(`\nError: src/content/pages/${slug}.md already exists.`);
		process.exit(1);
	}

	const content = ['---', `title: "${title}"`, '---', '', ''].join('\n');
	fs.writeFileSync(filePath, content);
	console.log(`\nCreated: src/content/pages/${slug}.md`);
}

// ─── Category ─────────────────────────────────────────────────────────────────

async function generateCategory(): Promise<void> {
	console.log('\nGenerate Category\n');

	const key = await ask('Key (slug)');
	if (!key) { console.error('\nError: Key is required.'); process.exit(1); }

	const categoriesPath = path.join(ROOT, 'config/categories.json');
	const categories = readCategories();

	if (categories[key]) {
		console.error(`\nError: Category "${key}" already exists.`);
		process.exit(1);
	}

	const label       = await ask('Label');
	const description = await ask('Description', '');

	categories[key] = { label, description };
	fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, '\t') + '\n');
	console.log(`\nAdded: "${key}" to config/categories.json`);
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

const commands: Record<string, () => Promise<void>> = {
	article:  generateArticle,
	page:     generatePage,
	category: generateCategory,
};

async function main(): Promise<void> {
	const cmd = process.argv[2];

	if (cmd && commands[cmd]) {
		await commands[cmd]();
	} else if (cmd) {
		console.error(`Unknown command: ${cmd}`);
		console.error('Available: article, page, category');
		process.exit(1);
	} else {
		console.log('Cosmolo Generator\n');
		console.log('  1. Article');
		console.log('  2. Page');
		console.log('  3. Category');
		const choice = await ask('\nWhat would you like to generate? (1/2/3)');
		const picked = ({ '1': generateArticle, '2': generatePage, '3': generateCategory } as Record<string, () => Promise<void>>)[choice];
		if (!picked) { console.error('Invalid choice.'); process.exit(1); }
		await picked();
	}

	rl.close();
}

main().catch(err => {
	console.error(err);
	rl.close();
	process.exit(1);
});
