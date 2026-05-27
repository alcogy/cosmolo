import { mock, describe, test, expect } from 'bun:test';
import type { ResolvedCosmoloConfig } from './types.js';

mock.module('cosmolo:content', () => ({
	rawMdFiles: {},
	svxModules: {},
	rawPageFiles: {
		'/src/content/pages/about.md': [
			'---',
			'title: "About Us"',
			'---',
			'',
			'This is the about page.',
			'',
			'It has **bold** text.',
		].join('\n'),
		'/src/content/pages/contact.md': ['---', 'title: "Contact"', '---', '', 'Get in touch.'].join(
			'\n'
		),
		'/src/content/pages/no-title.md': ['---', '---', '', 'No title here.'].join('\n'),
	},
	categoriesData: {},
	siteConfigData: {},
}));

const { getPageSlugs, getPage } = await import('./pages.js');

const config: ResolvedCosmoloConfig = {
	articlesDir: 'src/content/articles',
	pagesDir: 'src/content/pages',
	siteConfigPath: 'config/site.json',
	categoriesConfigPath: 'config/categories.json',
};

describe('getPageSlugs', () => {
	test('returns a slug for each page file', () => {
		const slugs = getPageSlugs(config);
		expect(slugs).toContain('about');
		expect(slugs).toContain('contact');
		expect(slugs).toContain('no-title');
	});

	test('strips .md extension from slugs', () => {
		const slugs = getPageSlugs(config);
		expect(slugs.every((s) => !s.endsWith('.md'))).toBe(true);
	});
});

describe('getPage', () => {
	test('returns page with correct slug and title', async () => {
		const page = await getPage(config, 'about');
		expect(page.slug).toBe('about');
		expect(page.title).toBe('About Us');
	});

	test('returns rendered HTML', async () => {
		const page = await getPage(config, 'about');
		expect(page.html).toContain('<strong>bold</strong>');
	});

	test('falls back to slug when title is missing from frontmatter', async () => {
		const page = await getPage(config, 'no-title');
		expect(page.title).toBe('no-title');
	});

	test('throws for unknown slug', async () => {
		await expect(getPage(config, 'nonexistent')).rejects.toThrow('Page not found');
	});
});
