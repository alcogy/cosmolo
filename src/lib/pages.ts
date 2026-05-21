import matter from 'gray-matter';
import { renderMarkdown } from './markdown';

export interface Page {
	slug: string;
	title: string;
	html: string;
}

const rawPageFiles = import.meta.glob('/src/content/pages/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

function slugFromPath(path: string): string {
	return path.replace(/^\/src\/content\/pages\//, '').replace(/\.md$/, '');
}

export function getPageSlugs(): string[] {
	return Object.keys(rawPageFiles).map(slugFromPath);
}

export async function getPage(slug: string): Promise<Page> {
	const path = `/src/content/pages/${slug}.md`;
	const raw = rawPageFiles[path];
	if (raw === undefined) {
		throw new Error(`Page not found: ${slug}`);
	}
	const { data, content } = matter(raw);
	const html = await renderMarkdown(content);
	return { slug, title: String(data.title ?? slug), html };
}
