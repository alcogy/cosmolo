import { describe, test, expect } from 'bun:test';
import { renderMarkdown, generateToc } from './markdown.js';

describe('renderMarkdown', () => {
	test('renders paragraph', async () => {
		const html = await renderMarkdown('Hello world.');
		expect(html).toContain('<p>Hello world.</p>');
	});

	test('renders heading with id attribute', async () => {
		const html = await renderMarkdown('## My Heading');
		expect(html).toContain('id="my-heading"');
		expect(html).toContain('<h2');
	});

	test('adds target and rel to external links', async () => {
		const html = await renderMarkdown('[link](https://example.com)');
		expect(html).toContain('target="_blank"');
		expect(html).toContain('rel="noopener noreferrer"');
	});

	test('does not add target to internal links', async () => {
		const html = await renderMarkdown('[about](/about)');
		expect(html).not.toContain('target="_blank"');
	});

	test('renders youtube extension as iframe embed', async () => {
		const html = await renderMarkdown('::youtube[dQw4w9WgXcQ]');
		expect(html).toContain('youtube-embed');
		expect(html).toContain('dQw4w9WgXcQ');
		expect(html).toContain('<iframe');
	});

	test('link title attribute is preserved', async () => {
		const html = await renderMarkdown('[link](https://example.com "My Title")');
		expect(html).toContain('title="My Title"');
	});
});

describe('generateToc', () => {
	test('returns empty array for content without headings', () => {
		expect(generateToc('Just a paragraph.')).toEqual([]);
	});

	test('skips h1 headings', () => {
		const toc = generateToc('# H1\n## H2');
		expect(toc).toHaveLength(1);
		expect(toc[0].level).toBe(2);
	});

	test('collects h2 through h6', () => {
		const content = '## Two\n### Three\n#### Four\n##### Five\n###### Six';
		const toc = generateToc(content);
		expect(toc).toHaveLength(5);
		expect(toc.map((e) => e.level)).toEqual([2, 3, 4, 5, 6]);
	});

	test('generates slug id from heading text', () => {
		const toc = generateToc('## Hello World');
		expect(toc[0].id).toBe('hello-world');
		expect(toc[0].text).toBe('Hello World');
	});

	test('strips inline bold markup from text', () => {
		const toc = generateToc('## **Bold** text');
		expect(toc[0].text).toBe('Bold text');
	});

	test('strips inline code from text', () => {
		const toc = generateToc('## Use `foo()` here');
		expect(toc[0].text).toBe('Use foo() here');
	});

	test('strips link markup from text', () => {
		const toc = generateToc('## See [docs](https://example.com)');
		expect(toc[0].text).toBe('See docs');
	});

	test('deduplicates identical heading ids with suffix', () => {
		const content = '## Same\n## Same\n## Same';
		const toc = generateToc(content);
		expect(toc[0].id).toBe('same');
		expect(toc[1].id).toBe('same-1');
		expect(toc[2].id).toBe('same-2');
	});
});
