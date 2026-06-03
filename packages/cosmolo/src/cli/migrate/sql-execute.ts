import * as path from 'path';
import * as readline from 'readline';
import { ARTICLE_COLUMNS, CATEGORY_COLUMNS, createTableSql } from './schema.js';
import { buildCategoriesInserts, buildArticlesInserts } from './sql-export.js';
import type { ResolvedCosmoloConfig } from '../../types.js';

function confirm(question: string): Promise<boolean> {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((resolve) =>
		rl.question(`${question} [y/N] `, (ans) => {
			rl.close();
			resolve(ans.trim().toLowerCase() === 'y');
		})
	);
}

function resolveDbPath(url: string): string | null {
	// Reject known non-SQLite URL schemes
	if (/^(postgres|postgresql|mysql|mariadb|mongodb):\/\//i.test(url)) return null;
	return url.replace(/^(sqlite:|file:)/, '');
}

export async function executeSqlDirect(config: ResolvedCosmoloConfig): Promise<void> {
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) {
		console.error('\n  DATABASE_URL is not set.');
		console.error('  Example: DATABASE_URL=./mysite.db bunx cosmolo migrate:db');
		process.exit(1);
	}

	const dbPath = resolveDbPath(dbUrl);
	if (!dbPath) {
		console.error('\n  Only SQLite databases are supported for direct execution.');
		console.error('  Use Option 1 to export SQL files for other database engines.');
		process.exit(1);
	}

	const root = process.cwd();
	const catInserts = buildCategoriesInserts(path.join(root, config.categoriesConfigPath));
	const artInserts = buildArticlesInserts(path.join(root, config.articlesDir));

	console.log(`\n  Target:     ${dbPath}`);
	console.log(`  Categories: ${catInserts.length} rows`);
	console.log(`  Articles:   ${artInserts.length} rows`);

	const ok = await confirm('\n  Proceed?');
	if (!ok) {
		console.log('  Aborted.');
		return;
	}

	// bun:sqlite is available in all bun runtimes
	const { Database } = await import('bun:sqlite' as string);
	const db = new Database(dbPath);

	try {
		db.run('BEGIN TRANSACTION');
		db.run(createTableSql('categories', CATEGORY_COLUMNS));
		db.run(createTableSql('articles', ARTICLE_COLUMNS));
		for (const sql of catInserts) db.run(sql);
		for (const sql of artInserts) db.run(sql);
		db.run('COMMIT');
		console.log('\n  ✓ Migration complete.');
	} catch (err) {
		db.run('ROLLBACK');
		console.error('\n  Migration failed:', err);
		process.exit(1);
	} finally {
		db.close();
	}
}
