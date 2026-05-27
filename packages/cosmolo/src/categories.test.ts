import { mock, describe, test, expect } from 'bun:test';
import type { ResolvedCosmoloConfig } from './types.js';

mock.module('cosmolo:content', () => ({
	rawMdFiles: {},
	svxModules: {},
	rawPageFiles: {},
	categoriesData: {
		tech: { label: 'Technology', description: 'Tech articles.' },
		life: { label: 'Lifestyle', description: 'Life articles.' },
	},
	siteConfigData: {
		url: 'https://example.com',
		name: 'Test Site',
		description: 'A test site.',
		twitterHandle: '@test',
		fallbackCategoryLabel: 'Other',
		articlesPerPage: 10,
		ogImage: { mode: 'static' },
	},
}));

// Dynamic import so mock is in place before categories.ts resolves cosmolo:content
const {
	getAllCategories,
	isKnownCategory,
	getCategoryLabel,
	getCategoryDescription,
	getCategorySlugs,
	loadSiteConfig,
} = await import('./categories.js');

const config: ResolvedCosmoloConfig = {
	articlesDir: 'src/content/articles',
	pagesDir: 'src/content/pages',
	siteConfigPath: 'config/site.json',
	categoriesConfigPath: 'config/categories.json',
};

describe('getAllCategories', () => {
	test('returns all category entries', () => {
		const categories = getAllCategories(config);
		expect(categories).toHaveLength(2);
	});

	test('each entry has slug, label, and description', () => {
		const categories = getAllCategories(config);
		const tech = categories.find((c) => c.slug === 'tech');
		expect(tech).toBeDefined();
		expect(tech?.label).toBe('Technology');
		expect(tech?.description).toBe('Tech articles.');
	});
});

describe('isKnownCategory', () => {
	test('returns true for known categories', () => {
		expect(isKnownCategory(config, 'tech')).toBe(true);
		expect(isKnownCategory(config, 'life')).toBe(true);
	});

	test('returns false for unknown category', () => {
		expect(isKnownCategory(config, 'unknown')).toBe(false);
		expect(isKnownCategory(config, 'other')).toBe(false);
	});
});

describe('getCategoryLabel', () => {
	test('returns label for known category', () => {
		expect(getCategoryLabel(config, 'tech')).toBe('Technology');
		expect(getCategoryLabel(config, 'life')).toBe('Lifestyle');
	});

	test('returns fallback label for unknown category', () => {
		expect(getCategoryLabel(config, 'other')).toBe('Other');
		expect(getCategoryLabel(config, 'nonexistent')).toBe('Other');
	});
});

describe('getCategoryDescription', () => {
	test('returns description for known category', () => {
		expect(getCategoryDescription(config, 'tech')).toBe('Tech articles.');
	});

	test('returns empty string for unknown category', () => {
		expect(getCategoryDescription(config, 'nonexistent')).toBe('');
	});
});

describe('getCategorySlugs', () => {
	test('includes all defined category keys', () => {
		const slugs = getCategorySlugs(config);
		expect(slugs).toContain('tech');
		expect(slugs).toContain('life');
	});

	test('always includes "other" slug', () => {
		expect(getCategorySlugs(config)).toContain('other');
	});
});

describe('loadSiteConfig', () => {
	test('returns site config data', () => {
		const site = loadSiteConfig(config);
		expect(site.name).toBe('Test Site');
		expect(site.url).toBe('https://example.com');
		expect(site.articlesPerPage).toBe(10);
		expect(site.fallbackCategoryLabel).toBe('Other');
	});
});
