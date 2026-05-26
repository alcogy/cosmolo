import matter from 'gray-matter';
import { renderMarkdown } from './markdown.js';
import type { Page, ResolvedCosmoloConfig } from './types.js';
import { rawPageFiles } from 'cosmolo:content';

function slugFromPath(filePath: string, dir: string): string {
	const prefix = dir.replace(/^\//, '');
	return filePath.replace(new RegExp(`^/?${prefix}/`), '').replace(/\.md$/, '');
}

export function getPageSlugs(config: ResolvedCosmoloConfig): string[] {
	return Object.keys(rawPageFiles).map((p) => slugFromPath(p, config.pagesDir));
}

export async function getPage(config: ResolvedCosmoloConfig, slug: string): Promise<Page> {
	const dir = config.pagesDir.replace(/^\//, '');
	const filePath = `/${dir}/${slug}.md`;
	const raw = rawPageFiles[filePath];
	if (raw === undefined) throw new Error(`Page not found: ${slug}`);
	const { data, content } = matter(raw);
	const html = await renderMarkdown(content);
	return { slug, title: String(data.title ?? slug), html };
}
