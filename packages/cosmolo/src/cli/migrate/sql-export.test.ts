import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { buildCategoriesInserts, buildArticlesInserts } from './sql-export.js';

let tmpDir: string;

beforeAll(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cosmolo-test-'));
});

afterAll(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('buildCategoriesInserts', () => {
	test('returns empty array when file does not exist', () => {
		expect(buildCategoriesInserts('/nonexistent/path.json')).toEqual([]);
	});

	test('generates INSERT statements from categories.json', () => {
		const categoriesPath = path.join(tmpDir, 'categories.json');
		fs.writeFileSync(
			categoriesPath,
			JSON.stringify({
				tech: { label: 'Technology', description: 'Tech articles' },
				design: { label: 'Design', description: '' },
			})
		);

		const inserts = buildCategoriesInserts(categoriesPath);
		expect(inserts).toHaveLength(2);
		expect(inserts[0]).toContain("INSERT INTO categories");
		expect(inserts[0]).toContain("'tech'");
		expect(inserts[0]).toContain("'Technology'");
		expect(inserts[1]).toContain("'design'");
	});

	test('escapes single quotes in values', () => {
		const categoriesPath = path.join(tmpDir, 'categories-quote.json');
		fs.writeFileSync(
			categoriesPath,
			JSON.stringify({ test: { label: "Dev's corner", description: '' } })
		);

		const inserts = buildCategoriesInserts(categoriesPath);
		expect(inserts[0]).toContain("Dev''s corner");
	});
});

describe('buildArticlesInserts', () => {
	test('returns empty array when directory does not exist', () => {
		expect(buildArticlesInserts('/nonexistent/dir')).toEqual([]);
	});

	test('generates INSERT statements from .md files', () => {
		const articlesDir = path.join(tmpDir, 'articles');
		fs.mkdirSync(articlesDir, { recursive: true });
		fs.writeFileSync(
			path.join(articlesDir, 'hello-world.md'),
			[
				'---',
				'title: Hello World',
				'category: tech',
				'excerpt: A first post.',
				'sort: 10',
				'---',
				'# Hello',
				'Body text here.',
			].join('\n')
		);

		const inserts = buildArticlesInserts(articlesDir);
		expect(inserts).toHaveLength(1);
		const sql = inserts[0];
		expect(sql).toContain("INSERT INTO articles");
		expect(sql).toContain("'hello-world'");
		expect(sql).toContain("'Hello World'");
		expect(sql).toContain("'tech'");
		expect(sql).toContain('10');
	});

	test('includes markdown body in INSERT', () => {
		const articlesDir = path.join(tmpDir, 'articles-body');
		fs.mkdirSync(articlesDir, { recursive: true });
		fs.writeFileSync(
			path.join(articlesDir, 'post.md'),
			['---', 'title: Post', 'category: x', 'excerpt: e', '---', "It's alive."].join('\n')
		);

		const inserts = buildArticlesInserts(articlesDir);
		// single quote in body must be escaped
		expect(inserts[0]).toContain("It''s alive.");
	});

	test('skips non-md/svx files', () => {
		const articlesDir = path.join(tmpDir, 'articles-mixed');
		fs.mkdirSync(articlesDir, { recursive: true });
		fs.writeFileSync(path.join(articlesDir, 'note.txt'), 'ignore me');
		fs.writeFileSync(
			path.join(articlesDir, 'real.md'),
			['---', 'title: Real', 'category: x', 'excerpt: e', '---', 'body'].join('\n')
		);

		const inserts = buildArticlesInserts(articlesDir);
		expect(inserts).toHaveLength(1);
	});

	test('collects articles from subdirectories', () => {
		const articlesDir = path.join(tmpDir, 'articles-nested');
		fs.mkdirSync(path.join(articlesDir, '2024'), { recursive: true });
		fs.writeFileSync(
			path.join(articlesDir, '2024', 'nested-post.md'),
			['---', 'title: Nested', 'category: x', 'excerpt: e', '---', 'body'].join('\n')
		);

		const inserts = buildArticlesInserts(articlesDir);
		expect(inserts).toHaveLength(1);
		expect(inserts[0]).toContain("'2024/nested-post'");
	});
});
