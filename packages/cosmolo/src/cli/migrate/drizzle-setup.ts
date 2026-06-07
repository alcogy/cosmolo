import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';
import { ARTICLE_COLUMNS, CATEGORY_COLUMNS } from './schema.js';
import type { SqlColumn } from './schema.js';
import type { ResolvedCosmoloConfig } from '../../types.js';

// ─── readline helpers ─────────────────────────────────────────────────────────

function ask(rl: readline.Interface, question: string, fallback = ''): Promise<string> {
	const hint = fallback ? ` [${fallback}]` : '';
	return new Promise((resolve) =>
		rl.question(`  ${question}${hint}: `, (ans) => resolve(ans.trim() || fallback))
	);
}

function confirm(rl: readline.Interface, question: string): Promise<boolean> {
	return new Promise((resolve) =>
		rl.question(`  ${question} [y/N] `, (ans) => resolve(ans.trim().toLowerCase() === 'y'))
	);
}

// ─── Drizzle schema generation ────────────────────────────────────────────────

function drizzleColumnDef(col: SqlColumn): string {
	const fn = col.type === 'TEXT' ? 'text' : 'integer';
	let chain = `  ${col.name}: ${fn}('${col.name}')`;

	if (col.primaryKey) {
		chain += '.primaryKey()';
	} else {
		if (col.notNull) chain += '.notNull()';
		if (col.defaultValue !== undefined) {
			const val =
				typeof col.defaultValue === 'string' ? `'${col.defaultValue}'` : col.defaultValue;
			chain += `.default(${val})`;
		}
	}

	return chain + ',';
}

function generateDrizzleSchema(): string {
	const catCols = CATEGORY_COLUMNS.map(drizzleColumnDef).join('\n');
	const artCols = ARTICLE_COLUMNS.map(drizzleColumnDef).join('\n');
	return (
		`import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';\n\n` +
		`export const categories = sqliteTable('categories', {\n${catCols}\n});\n\n` +
		`export const articles = sqliteTable('articles', {\n${artCols}\n});\n`
	);
}

// ─── CRUD file generation ─────────────────────────────────────────────────────

function generateArticlesCrud(): string {
	return `import { drizzle } from 'drizzle-orm/d1';
import { and, desc, eq, sql } from 'drizzle-orm';
import { articles } from '../../../drizzle/schema';

export function createDb(d1: D1Database) {
  return drizzle(d1);
}

export function parseArticle<T extends { tags: string | null; related: string | null }>(row: T) {
  return {
    ...row,
    tags: JSON.parse(row.tags ?? '[]') as string[],
    related: JSON.parse(row.related ?? '[]') as string[],
  };
}

export async function getArticles(d1: D1Database) {
  return createDb(d1)
    .select()
    .from(articles)
    .where(eq(articles.draft, 0))
    .orderBy(desc(articles.sort));
}

export async function getArticlesByCategory(d1: D1Database, category: string) {
  return createDb(d1)
    .select()
    .from(articles)
    .where(and(eq(articles.draft, 0), eq(articles.category, category)))
    .orderBy(desc(articles.sort));
}

export async function getArticlesByTag(d1: D1Database, tag: string) {
  return createDb(d1)
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.draft, 0),
        sql\`EXISTS (SELECT 1 FROM json_each(\${articles.tags}) WHERE value = \${tag})\`
      )
    )
    .orderBy(desc(articles.sort));
}

export async function getArticle(d1: D1Database, slug: string) {
  const [row] = await createDb(d1).select().from(articles).where(eq(articles.slug, slug));
  return row ?? null;
}

export async function createArticle(d1: D1Database, data: typeof articles.$inferInsert) {
  return createDb(d1).insert(articles).values(data).returning();
}

export async function updateArticle(
  d1: D1Database,
  slug: string,
  data: Partial<typeof articles.$inferInsert>
) {
  return createDb(d1)
    .update(articles)
    .set({ ...data, updated_at: new Date().toISOString().split('T')[0] })
    .where(eq(articles.slug, slug))
    .returning();
}

export async function deleteArticle(d1: D1Database, slug: string) {
  return createDb(d1).delete(articles).where(eq(articles.slug, slug));
}
`;
}

function generateCategoriesCrud(): string {
	return `import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { categories } from '../../../drizzle/schema';

export function createDb(d1: D1Database) {
  return drizzle(d1);
}

export async function getCategories(d1: D1Database) {
  return createDb(d1).select().from(categories);
}

export async function getCategory(d1: D1Database, key: string) {
  const [row] = await createDb(d1).select().from(categories).where(eq(categories.key, key));
  return row ?? null;
}

export async function createCategory(d1: D1Database, data: typeof categories.$inferInsert) {
  return createDb(d1).insert(categories).values(data).returning();
}

export async function updateCategory(
  d1: D1Database,
  key: string,
  data: Partial<typeof categories.$inferInsert>
) {
  return createDb(d1).update(categories).set(data).where(eq(categories.key, key)).returning();
}

export async function deleteCategory(d1: D1Database, key: string) {
  return createDb(d1).delete(categories).where(eq(categories.key, key));
}
`;
}

// ─── Route file generation ────────────────────────────────────────────────────

function generateHomeRoute(): string {
	return `import type { PageServerLoad } from './$types';
import { getArticles, parseArticle } from '$lib/db/articles';
import { getCategories } from '$lib/db/categories';
import siteConfig from '../../config/site.json';

export const load: PageServerLoad = async ({ platform }) => {
  const db = platform!.env.DB;
  const [rawArticles, categories] = await Promise.all([getArticles(db), getCategories(db)]);
  return {
    articles: rawArticles.map(parseArticle),
    categories,
    articlesPerPage: siteConfig.articlesPerPage ?? 10,
  };
};
`;
}

function generateArticleRoute(): string {
	return `import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { marked } from 'marked';
import { getArticle, parseArticle } from '$lib/db/articles';
import { getCategories } from '$lib/db/categories';

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform!.env.DB;
  const [raw, categories] = await Promise.all([getArticle(db, params.slug), getCategories(db)]);
  if (!raw) error(404, 'Article not found');
  const article = {
    ...parseArticle(raw),
    html: await marked(raw.body ?? ''),
    toc: [],
  };
  return {
    article,
    categories,
    updatedAt: raw.updated_at ?? '',
    related: [],
    seriesTotal: 0,
    seriesPrev: null,
    seriesNext: null,
  };
};
`;
}

function generateCategoryRoute(): string {
	return `import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getArticlesByCategory, parseArticle } from '$lib/db/articles';
import { getCategory } from '$lib/db/categories';
import siteConfig from '../../../../config/site.json';

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform!.env.DB;
  const [rawArticles, category] = await Promise.all([
    getArticlesByCategory(db, params.slug),
    getCategory(db, params.slug),
  ]);
  if (!category) error(404, 'Category not found');
  return {
    articles: rawArticles.map(parseArticle),
    label: category.label,
    description: category.description ?? '',
    slug: params.slug,
    articlesPerPage: siteConfig.articlesPerPage ?? 10,
  };
};
`;
}

function generateTagRoute(): string {
	return `import type { PageServerLoad } from './$types';
import { getArticlesByTag, parseArticle } from '$lib/db/articles';
import siteConfig from '../../../../config/site.json';

export const load: PageServerLoad = async ({ params, platform }) => {
  const db = platform!.env.DB;
  const rawArticles = await getArticlesByTag(db, params.tag);
  return {
    articles: rawArticles.map(parseArticle),
    tag: params.tag,
    articlesPerPage: siteConfig.articlesPerPage ?? 10,
  };
};
`;
}

function generateDrizzleConfig(): string {
	return `import type { Config } from 'drizzle-kit';

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
} satisfies Config;
`;
}

function generateDevVarsExample(): string {
	return `CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_DATABASE_ID=
CLOUDFLARE_D1_TOKEN=
`;
}

// ─── wrangler.toml helpers ────────────────────────────────────────────────────

function d1Section(dbName: string): string {
	return (
		`\n[[d1_databases]]\n` +
		`binding = "DB"\n` +
		`database_name = "${dbName}"\n` +
		`database_id = "REPLACE_WITH_YOUR_DATABASE_ID"\n`
	);
}

function updateWranglerToml(root: string, dbName: string): 'created' | 'appended' {
	const wranglerPath = path.join(root, 'wrangler.toml');
	if (fs.existsSync(wranglerPath)) {
		const existing = fs.readFileSync(wranglerPath, 'utf-8');
		fs.writeFileSync(wranglerPath, existing + d1Section(dbName));
		return 'appended';
	}
	const minimal =
		`name = "cosmolo-site"\n` +
		`compatibility_date = "2025-01-01"\n` +
		d1Section(dbName);
	fs.writeFileSync(wranglerPath, minimal);
	return 'created';
}

// ─── preflight checks ─────────────────────────────────────────────────────────

async function preflight(
	root: string,
	rl: readline.Interface
): Promise<{ dbName: string; generateRoutes: boolean } | null> {
	console.log('\n  Checking environment...\n');

	// drizzle-orm installed?
	const drizzleInstalled = fs.existsSync(path.join(root, 'node_modules', 'drizzle-orm'));
	if (!drizzleInstalled) {
		console.log('  drizzle-orm is not installed.');
		const install = await confirm(rl, 'Install drizzle-orm and drizzle-kit now?');
		if (install) {
			console.log('  Running: bun add drizzle-orm drizzle-kit ...');
			execSync('bun add drizzle-orm drizzle-kit', { stdio: 'inherit', cwd: root });
		} else {
			console.log(
				'  Install drizzle-orm and drizzle-kit manually, then re-run migrate:db.'
			);
			return null;
		}
	}

	// wrangler.toml: existing D1 binding?
	const wranglerPath = path.join(root, 'wrangler.toml');
	if (fs.existsSync(wranglerPath)) {
		const content = fs.readFileSync(wranglerPath, 'utf-8');
		if (content.includes('[[d1_databases]]')) {
			console.log('  Warning: wrangler.toml already contains [[d1_databases]].');
			const proceed = await confirm(rl, 'Add another D1 binding anyway?');
			if (!proceed) return null;
		}
	}

	// drizzle/schema.ts exists?
	const schemaPath = path.join(root, 'drizzle', 'schema.ts');
	if (fs.existsSync(schemaPath)) {
		const ok = await confirm(rl, 'drizzle/schema.ts already exists. Overwrite?');
		if (!ok) return null;

		// table name conflict check
		const existing = fs.readFileSync(schemaPath, 'utf-8');
		const conflicts = ['articles', 'categories'].filter((t) =>
			existing.includes(`sqliteTable('${t}'`)
		);
		if (conflicts.length > 0) {
			console.log(`  Warning: table(s) already defined in schema: ${conflicts.join(', ')}`);
			const ok2 = await confirm(rl, 'Continue and overwrite?');
			if (!ok2) return null;
		}
	}

	// drizzle.config.ts exists?
	const drizzleConfigPath = path.join(root, 'drizzle.config.ts');
	if (fs.existsSync(drizzleConfigPath)) {
		const ok = await confirm(rl, 'drizzle.config.ts already exists. Overwrite?');
		if (!ok) return null;
	}

	// src/lib/db/ CRUD files exist?
	const dbDir = path.join(root, 'src', 'lib', 'db');
	const crudFiles = ['articles.ts', 'categories.ts'].filter((f) =>
		fs.existsSync(path.join(dbDir, f))
	);
	if (crudFiles.length > 0) {
		console.log(`  Warning: src/lib/db/${crudFiles.join(', ')} already exist.`);
		const ok = await confirm(rl, 'Overwrite CRUD files?');
		if (!ok) return null;
	}

	// D1 database name
	const dbName = await ask(rl, 'D1 database name', 'cosmolo');

	// Generate D1-backed routes?
	const routePaths = [
		path.join('src', 'routes', '+page.server.ts'),
		path.join('src', 'routes', 'articles', '[slug]', '+page.server.ts'),
		path.join('src', 'routes', 'categories', '[slug]', '+page.server.ts'),
		path.join('src', 'routes', 'tags', '[tag]', '+page.server.ts'),
	];
	const existingRoutes = routePaths.filter((p) => fs.existsSync(path.join(root, p)));
	let generateRoutes = true;
	if (existingRoutes.length > 0) {
		console.log(`\n  The following route files will be replaced with D1-backed versions:`);
		for (const p of existingRoutes) console.log(`    ${p}`);
		generateRoutes = await confirm(rl, 'Replace with D1-backed route files?');
	} else {
		generateRoutes = await confirm(rl, 'Generate D1-backed route files?');
	}

	return { dbName, generateRoutes };
}

// ─── main ─────────────────────────────────────────────────────────────────────

export async function drizzleSetup(_config: ResolvedCosmoloConfig): Promise<void> {
	const root = process.cwd();
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

	const result = await preflight(root, rl);
	rl.close();
	if (!result) return;

	const { dbName, generateRoutes } = result;

	// Generate drizzle/schema.ts
	const drizzleDir = path.join(root, 'drizzle');
	fs.mkdirSync(drizzleDir, { recursive: true });
	fs.writeFileSync(path.join(drizzleDir, 'schema.ts'), generateDrizzleSchema());

	// Generate src/lib/db/articles.ts and categories.ts
	const dbDir = path.join(root, 'src', 'lib', 'db');
	fs.mkdirSync(dbDir, { recursive: true });
	fs.writeFileSync(path.join(dbDir, 'articles.ts'), generateArticlesCrud());
	fs.writeFileSync(path.join(dbDir, 'categories.ts'), generateCategoriesCrud());

	// drizzle.config.ts
	fs.writeFileSync(path.join(root, 'drizzle.config.ts'), generateDrizzleConfig());

	// .dev.vars.example
	if (!fs.existsSync(path.join(root, '.dev.vars.example'))) {
		fs.writeFileSync(path.join(root, '.dev.vars.example'), generateDevVarsExample());
	}

	// wrangler.toml
	const wranglerAction = updateWranglerToml(root, dbName);

	// D1-backed route files
	if (generateRoutes) {
		const routesDir = path.join(root, 'src', 'routes');
		const routeFiles: Array<[string, string]> = [
			[path.join(routesDir, '+page.server.ts'), generateHomeRoute()],
			[path.join(routesDir, 'articles', '[slug]', '+page.server.ts'), generateArticleRoute()],
			[path.join(routesDir, 'categories', '[slug]', '+page.server.ts'), generateCategoryRoute()],
			[path.join(routesDir, 'tags', '[tag]', '+page.server.ts'), generateTagRoute()],
		];
		for (const [filePath, content] of routeFiles) {
			fs.mkdirSync(path.dirname(filePath), { recursive: true });
			fs.writeFileSync(filePath, content);
		}
	}

	console.log('\n✓ Files generated:');
	console.log('  drizzle/schema.ts');
	console.log('  src/lib/db/articles.ts');
	console.log('  src/lib/db/categories.ts');
	console.log('  drizzle.config.ts');
	console.log('  .dev.vars.example');
	console.log(`  wrangler.toml  (${wranglerAction})`);
	if (generateRoutes) {
		console.log('  src/routes/+page.server.ts');
		console.log('  src/routes/articles/[slug]/+page.server.ts');
		console.log('  src/routes/categories/[slug]/+page.server.ts');
		console.log('  src/routes/tags/[tag]/+page.server.ts');
	}

	let step = 1;
	console.log('\nNext steps:\n');
	console.log(`  ${step++}. Create the D1 database (if not done yet):`);
	console.log(`       bunx wrangler d1 create ${dbName}`);
	console.log(`     Copy the database_id into wrangler.toml.\n`);
	console.log(`  ${step++}. Generate migration files:`);
	console.log(`       bunx drizzle-kit generate\n`);
	console.log(`  ${step++}. Apply migrations locally:`);
	console.log(`       bunx wrangler d1 migrations apply ${dbName} --local\n`);
	console.log(`  ${step++}. Seed content from Markdown files:`);
	console.log(`       bunx cosmolo migrate:db  → choose Option 1 to export SQL`);
	console.log(`       bunx wrangler d1 execute ${dbName} --local --file=cosmolo-migration/002_seed_categories.sql`);
	console.log(`       bunx wrangler d1 execute ${dbName} --local --file=cosmolo-migration/003_seed_articles.sql\n`);
	if (generateRoutes) {
		console.log(`  ${step++}. Install marked for Markdown rendering in routes:`);
		console.log(`       bun add marked\n`);
	}
	console.log(`  ${step++}. Install Cloudflare Workers types for TypeScript:`);
	console.log(`       bun add -d @cloudflare/workers-types\n`);
	console.log(`  ${step++}. Ensure src/app.d.ts declares the DB binding:`);
	console.log(`       interface Platform { env: { DB: D1Database } }`);
	console.log(`       (cosmolo init --cloudflare does this automatically)\n`);
	console.log(`  See docs/DB_MIGRATION.md for full details.`);
}
