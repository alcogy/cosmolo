import { describe, test, expect } from 'bun:test';
import { createTableSql, toSqlLiteral, ARTICLE_COLUMNS, CATEGORY_COLUMNS } from './schema.js';

describe('createTableSql', () => {
	test('generates categories table', () => {
		const sql = createTableSql('categories', CATEGORY_COLUMNS);
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS categories');
		expect(sql).toContain('key TEXT PRIMARY KEY');
		expect(sql).toContain('label TEXT NOT NULL');
		expect(sql).toContain("description TEXT NOT NULL DEFAULT ''");
	});

	test('generates articles table', () => {
		const sql = createTableSql('articles', ARTICLE_COLUMNS);
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS articles');
		expect(sql).toContain('slug TEXT PRIMARY KEY');
		expect(sql).toContain('title TEXT NOT NULL');
		expect(sql).toContain('sort INTEGER NOT NULL DEFAULT 0');
		expect(sql).toContain("tags TEXT NOT NULL DEFAULT '[]'");
		expect(sql).toContain('series TEXT');
		expect(sql).toContain('series_order INTEGER');
		expect(sql).toContain('draft INTEGER NOT NULL DEFAULT 0');
		expect(sql).toContain('body TEXT NOT NULL');
	});

	test('nullable columns have no NOT NULL constraint', () => {
		const sql = createTableSql('articles', ARTICLE_COLUMNS);
		// series and series_order are nullable — must not have NOT NULL
		const lines = sql.split('\n');
		const seriesLine = lines.find((l) => l.trim().startsWith('series '));
		const seriesOrderLine = lines.find((l) => l.trim().startsWith('series_order '));
		expect(seriesLine).not.toContain('NOT NULL');
		expect(seriesOrderLine).not.toContain('NOT NULL');
	});
});

describe('toSqlLiteral', () => {
	test('null and undefined → NULL', () => {
		expect(toSqlLiteral(null)).toBe('NULL');
		expect(toSqlLiteral(undefined)).toBe('NULL');
	});

	test('boolean → 0 or 1', () => {
		expect(toSqlLiteral(false)).toBe('0');
		expect(toSqlLiteral(true)).toBe('1');
	});

	test('number → string', () => {
		expect(toSqlLiteral(42)).toBe('42');
		expect(toSqlLiteral(0)).toBe('0');
	});

	test('string → single-quoted', () => {
		expect(toSqlLiteral('hello')).toBe("'hello'");
	});

	test('string escapes single quotes', () => {
		expect(toSqlLiteral("it's")).toBe("'it''s'");
	});

	test('Date → ISO date string', () => {
		const d = new Date('2025-06-15T00:00:00Z');
		expect(toSqlLiteral(d)).toBe("'2025-06-15'");
	});

	test('array → JSON text', () => {
		expect(toSqlLiteral(['a', 'b'])).toBe("'[\"a\",\"b\"]'");
		expect(toSqlLiteral([])).toBe("'[]'");
	});
});
