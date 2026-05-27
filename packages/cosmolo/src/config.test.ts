import { describe, test, expect } from 'bun:test';
import { resolveConfig, DEFAULT_CONFIG } from './config.js';

describe('resolveConfig', () => {
	test('returns defaults when called with no arguments', () => {
		expect(resolveConfig()).toEqual(DEFAULT_CONFIG);
	});

	test('returns defaults when called with empty object', () => {
		expect(resolveConfig({})).toEqual(DEFAULT_CONFIG);
	});

	test('overrides articlesDir only', () => {
		const result = resolveConfig({ articlesDir: 'content/posts' });
		expect(result.articlesDir).toBe('content/posts');
		expect(result.pagesDir).toBe(DEFAULT_CONFIG.pagesDir);
		expect(result.siteConfigPath).toBe(DEFAULT_CONFIG.siteConfigPath);
		expect(result.categoriesConfigPath).toBe(DEFAULT_CONFIG.categoriesConfigPath);
	});

	test('overrides all fields', () => {
		const custom = {
			articlesDir: 'custom/articles',
			pagesDir: 'custom/pages',
			siteConfigPath: 'custom/site.json',
			categoriesConfigPath: 'custom/categories.json',
		};
		expect(resolveConfig(custom)).toEqual(custom);
	});
});
