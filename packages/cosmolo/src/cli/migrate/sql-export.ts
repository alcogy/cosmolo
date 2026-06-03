import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import {
	ARTICLE_COLUMNS,
	CATEGORY_COLUMNS,
	createTableSql,
	escapeSql,
	toSqlLiteral,
} from './schema.js';
import type { ResolvedCosmoloConfig } from '../../types.js';

type CategoryMap = Record<string, { label?: string; description?: string }>;

export function buildCategoriesInserts(categoriesPath: string): string[] {
	if (!fs.existsSync(categoriesPath)) return [];
	const raw = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8')) as CategoryMap;
	return Object.entries(raw).map(([key, entry]) => {
		const label = escapeSql(entry.label ?? '');
		const description = escapeSql(entry.description ?? '');
		return `INSERT INTO categories (key, label, description) VALUES ('${escapeSql(key)}', '${label}', '${description}');`;
	});
}

function collectArticleFiles(dir: string, baseDir: string): { filePath: string; slug: string }[] {
	const results: { filePath: string; slug: string }[] = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...collectArticleFiles(fullPath, baseDir));
		} else if (/\.(md|svx)$/.test(entry.name)) {
			const rel = path.relative(baseDir, fullPath).replace(/\.(md|svx)$/, '');
			// Normalize path separators to forward slashes for slug
			results.push({ filePath: fullPath, slug: rel.replace(/\\/g, '/') });
		}
	}
	return results;
}

export function buildArticlesInserts(articlesDir: string): string[] {
	if (!fs.existsSync(articlesDir)) return [];
	return collectArticleFiles(articlesDir, articlesDir).map(({ filePath, slug }) => {
		const raw = fs.readFileSync(filePath, 'utf-8');
		const { data, content } = matter(raw);

		const dateVal =
			data.date instanceof Date
				? data.date.toISOString().split('T')[0]
				: (data.date ?? '');

		const values = [
			toSqlLiteral(slug),
			toSqlLiteral(data.title ?? ''),
			toSqlLiteral(data.category ?? ''),
			toSqlLiteral(data.excerpt ?? ''),
			toSqlLiteral(data.sort ?? 0),
			toSqlLiteral(dateVal),
			toSqlLiteral(data.tags ?? []),
			toSqlLiteral(data.series ?? null),
			toSqlLiteral(data.seriesOrder ?? null),
			toSqlLiteral(data.draft ?? false),
			toSqlLiteral(data.related ?? []),
			toSqlLiteral(content),
		].join(', ');

		const cols =
			'slug, title, category, excerpt, sort, date, tags, series, series_order, draft, related, body';
		return `INSERT INTO articles (${cols}) VALUES (${values});`;
	});
}

export async function exportSqlFiles(config: ResolvedCosmoloConfig): Promise<void> {
	const root = process.cwd();
	const outputDir = path.join(root, 'cosmolo-migration');
	fs.mkdirSync(outputDir, { recursive: true });

	const createSql =
		createTableSql('categories', CATEGORY_COLUMNS) +
		'\n\n' +
		createTableSql('articles', ARTICLE_COLUMNS);
	fs.writeFileSync(path.join(outputDir, '001_create_tables.sql'), createSql + '\n');

	const categoriesPath = path.join(root, config.categoriesConfigPath);
	const catInserts = buildCategoriesInserts(categoriesPath);
	fs.writeFileSync(
		path.join(outputDir, '002_seed_categories.sql'),
		catInserts.join('\n') + '\n'
	);

	const articlesDir = path.join(root, config.articlesDir);
	const artInserts = buildArticlesInserts(articlesDir);
	fs.writeFileSync(
		path.join(outputDir, '003_seed_articles.sql'),
		artInserts.join('\n') + '\n'
	);

	console.log(`\n✓ SQL files written to cosmolo-migration/`);
	console.log('  001_create_tables.sql');
	console.log(`  002_seed_categories.sql  (${catInserts.length} rows)`);
	console.log(`  003_seed_articles.sql    (${artInserts.length} rows)`);
	console.log('\nReview the files and run them against your database.');
}
