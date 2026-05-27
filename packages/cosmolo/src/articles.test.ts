import { mock, describe, test, expect } from 'bun:test';
import type { ResolvedCosmoloConfig } from './types.js';

mock.module('cosmolo:content', () => ({
	rawMdFiles: {
		'/src/content/articles/hello.md': [
			'---',
			'title: "Hello World"',
			'category: "tech"',
			'excerpt: "A test article."',
			'sort: 10',
			'date: "2025-01-01"',
			'---',
			'# Hello World',
			'',
			'This is content.',
		].join('\n'),
		'/src/content/articles/draft-post.md': [
			'---',
			'title: "Draft Post"',
			'category: "tech"',
			'excerpt: "This is a draft."',
			'sort: 5',
			'draft: true',
			'---',
			'Draft content.',
		].join('\n'),
		'/src/content/articles/tagged.md': [
			'---',
			'title: "Tagged Post"',
			'category: "life"',
			'excerpt: "Has tags."',
			'sort: 1',
			'tags:',
			'  - svelte',
			'  - typescript',
			'---',
			'Tagged content.',
		].join('\n'),
		'/src/content/articles/series-one.md': [
			'---',
			'title: "Series Part 1"',
			'category: "tech"',
			'excerpt: "First in series."',
			'sort: 20',
			'series: "my-series"',
			'seriesOrder: 1',
			'---',
			'Part 1.',
		].join('\n'),
		'/src/content/articles/series-two.md': [
			'---',
			'title: "Series Part 2"',
			'category: "tech"',
			'excerpt: "Second in series."',
			'sort: 15',
			'series: "my-series"',
			'seriesOrder: 2',
			'---',
			'Part 2.',
		].join('\n'),
	},
	svxModules: {},
}));

// Dynamic import so mock is in place before articles.ts resolves cosmolo:content
const {
	articleFrontmatterSchema,
	getArticles,
	getSlugs,
	getArticle,
	getArticlesByCategory,
	getArticlesByTag,
	getArticlesBySeries,
	getTags,
} = await import('./articles.js');

const config: ResolvedCosmoloConfig = {
	articlesDir: 'src/content/articles',
	pagesDir: 'src/content/pages',
	siteConfigPath: 'config/site.json',
	categoriesConfigPath: 'config/categories.json',
};

// ─── articleFrontmatterSchema ──────────────────────────────────────────────────

describe('articleFrontmatterSchema', () => {
	test('applies defaults for optional fields', () => {
		const result = articleFrontmatterSchema.parse({
			title: 'My Article',
			category: 'tech',
			excerpt: 'Short summary.',
		});
		expect(result.sort).toBe(0);
		expect(result.date).toBe('');
		expect(result.tags).toEqual([]);
		expect(result.draft).toBe(false);
		expect(result.related).toEqual([]);
	});

	test('accepts all fields', () => {
		const result = articleFrontmatterSchema.parse({
			title: 'Full',
			category: 'tech',
			excerpt: 'Excerpt.',
			sort: 5,
			date: '2025-06-01',
			tags: ['a', 'b'],
			series: 'my-series',
			seriesOrder: 1,
			draft: false,
			related: ['other-post'],
		});
		expect(result.series).toBe('my-series');
		expect(result.seriesOrder).toBe(1);
		expect(result.related).toEqual(['other-post']);
	});

	test('converts Date object to ISO date string', () => {
		const result = articleFrontmatterSchema.parse({
			title: 'T',
			category: 'c',
			excerpt: 'E',
			date: new Date('2025-06-15'),
		});
		expect(result.date).toBe('2025-06-15');
	});

	test('throws on missing required fields', () => {
		expect(() => articleFrontmatterSchema.parse({})).toThrow();
	});

	test('throws when title is missing', () => {
		expect(() =>
			articleFrontmatterSchema.parse({ category: 'tech', excerpt: 'E' })
		).toThrow();
	});
});

// ─── getArticles ───────────────────────────────────────────────────────────────

describe('getArticles', () => {
	test('returns non-draft articles only', () => {
		const articles = getArticles(config);
		expect(articles.every((a) => !a.draft)).toBe(true);
	});

	test('excludes draft articles', () => {
		const articles = getArticles(config);
		expect(articles.find((a) => a.slug === 'draft-post')).toBeUndefined();
	});

	test('sorts articles by sort field descending', () => {
		const articles = getArticles(config);
		const sorts = articles.map((a) => a.sort);
		expect(sorts).toEqual([...sorts].sort((a, b) => b - a));
	});

	test('returns correct slugs', () => {
		const slugs = getArticles(config).map((a) => a.slug);
		expect(slugs).toContain('hello');
		expect(slugs).toContain('tagged');
		expect(slugs).toContain('series-one');
		expect(slugs).toContain('series-two');
	});
});

// ─── getSlugs ─────────────────────────────────────────────────────────────────

describe('getSlugs', () => {
	test('returns slug strings', () => {
		const slugs = getSlugs(config);
		expect(Array.isArray(slugs)).toBe(true);
		expect(slugs).toContain('hello');
	});
});

// ─── getArticle ───────────────────────────────────────────────────────────────

describe('getArticle', () => {
	test('returns article with rendered HTML', async () => {
		const article = await getArticle(config, 'hello');
		expect(article.title).toBe('Hello World');
		expect(article.html).toContain('<p>');
	});

	test('returns article with correct slug', async () => {
		const article = await getArticle(config, 'hello');
		expect(article.slug).toBe('hello');
	});

	test('includes draft articles', async () => {
		const article = await getArticle(config, 'draft-post');
		expect(article.title).toBe('Draft Post');
		expect(article.draft).toBe(true);
	});

	test('throws for unknown slug', async () => {
		await expect(getArticle(config, 'nonexistent')).rejects.toThrow('Article not found');
	});
});

// ─── getArticlesByCategory ────────────────────────────────────────────────────

describe('getArticlesByCategory', () => {
	test('filters by category slug', () => {
		const articles = getArticlesByCategory(config, 'life');
		expect(articles.every((a) => a.category === 'life')).toBe(true);
		expect(articles.find((a) => a.slug === 'tagged')).toBeDefined();
	});

	test('returns empty array for "other" when all categories are known', () => {
		const articles = getArticlesByCategory(config, 'other');
		expect(Array.isArray(articles)).toBe(true);
	});

	test('excludes a specific slug when provided', () => {
		const articles = getArticlesByCategory(config, 'tech', 'hello');
		expect(articles.find((a) => a.slug === 'hello')).toBeUndefined();
	});
});

// ─── getArticlesByTag ─────────────────────────────────────────────────────────

describe('getArticlesByTag', () => {
	test('returns articles that include the given tag', () => {
		const articles = getArticlesByTag(config, 'svelte');
		expect(articles).toHaveLength(1);
		expect(articles[0].slug).toBe('tagged');
	});

	test('returns empty array for unused tag', () => {
		expect(getArticlesByTag(config, 'nonexistent-tag')).toEqual([]);
	});
});

// ─── getArticlesBySeries ──────────────────────────────────────────────────────

describe('getArticlesBySeries', () => {
	test('returns articles in seriesOrder ascending', () => {
		const articles = getArticlesBySeries(config, 'my-series');
		expect(articles).toHaveLength(2);
		expect(articles[0].slug).toBe('series-one');
		expect(articles[1].slug).toBe('series-two');
	});

	test('returns empty array for unknown series', () => {
		expect(getArticlesBySeries(config, 'no-such-series')).toEqual([]);
	});
});

// ─── getTags ──────────────────────────────────────────────────────────────────

describe('getTags', () => {
	test('returns sorted unique tags', () => {
		const tags = getTags(config);
		expect(tags).toContain('svelte');
		expect(tags).toContain('typescript');
		expect(tags).toEqual([...tags].sort());
	});

	test('returns no duplicates', () => {
		const tags = getTags(config);
		expect(new Set(tags).size).toBe(tags.length);
	});
});
