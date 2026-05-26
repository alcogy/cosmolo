import { z } from 'zod';
import matter from 'gray-matter';
import { renderMarkdown, generateToc } from './markdown.js';
import { isKnownCategory } from './categories.js';
import type { Article, ResolvedCosmoloConfig } from './types.js';
import { rawMdFiles, svxModules } from 'cosmolo:content';

export const articleFrontmatterSchema = z.object({
	title: z.string(),
	category: z.string(),
	excerpt: z.string(),
	sort: z.number().default(0),
	date: z.preprocess(
		(val) => (val instanceof Date ? val.toISOString().split('T')[0] : val),
		z.string().default('')
	),
	tags: z.array(z.string()).default([]),
	series: z.string().optional(),
	seriesOrder: z.number().optional(),
	draft: z.boolean().default(false),
	related: z.array(z.string()).default([]),
});

function slugFromPath(filePath: string, dir: string): string {
	const prefix = dir.replace(/^\//, '');
	return filePath
		.replace(new RegExp(`^/?${prefix}/`), '')
		.replace(/\.(md|svx)$/, '');
}

/** Returns all non-draft articles sorted by `sort` descending. */
export function getArticles(config: ResolvedCosmoloConfig): Article[] {
	const articles: Article[] = [];

	for (const [filePath, raw] of Object.entries(rawMdFiles)) {
		const slug = slugFromPath(filePath, config.articlesDir);
		const { data } = matter(raw);
		const frontmatter = articleFrontmatterSchema.parse(data);
		if (frontmatter.draft) continue;
		articles.push({ ...frontmatter, slug, html: '', markdown: '', toc: [] });
	}

	for (const [filePath, mod] of Object.entries(svxModules)) {
		const slug = slugFromPath(filePath, config.articlesDir);
		const frontmatter = articleFrontmatterSchema.parse(
			(mod as { metadata: Record<string, unknown> }).metadata
		);
		if (frontmatter.draft) continue;
		articles.push({ ...frontmatter, slug, html: '', markdown: '', toc: [] });
	}

	return articles.sort((a, b) => b.sort - a.sort);
}

/** Returns all non-draft article slugs. */
export function getSlugs(config: ResolvedCosmoloConfig): string[] {
	return getArticles(config).map((a) => a.slug);
}

/** Returns a single article with rendered HTML and TOC. Draft articles are included. */
export async function getArticle(config: ResolvedCosmoloConfig, slug: string): Promise<Article> {
	const dir = config.articlesDir.replace(/^\//, '');
	const mdPath = `/${dir}/${slug}.md`;
	const svxPath = `/${dir}/${slug}.svx`;

	if (rawMdFiles[mdPath] !== undefined) {
		const raw = rawMdFiles[mdPath];
		const { data, content } = matter(raw);
		const frontmatter = articleFrontmatterSchema.parse(data);
		const html = await renderMarkdown(content);
		const toc = generateToc(content);
		return { ...frontmatter, slug, html, markdown: content, toc };
	}

	if (svxModules[svxPath] !== undefined) {
		const frontmatter = articleFrontmatterSchema.parse(
			(svxModules[svxPath] as { metadata: Record<string, unknown> }).metadata
		);
		return { ...frontmatter, slug, html: '', markdown: '', toc: [] };
	}

	throw new Error(`Article not found: ${slug}`);
}

export function getArticlesByCategory(
	config: ResolvedCosmoloConfig,
	categorySlug: string,
	excludeSlug?: string
): Article[] {
	const all = getArticles(config);
	const filtered =
		categorySlug === 'other'
			? all.filter((a) => !isKnownCategory(config, a.category))
			: all.filter((a) => a.category === categorySlug);
	return excludeSlug ? filtered.filter((a) => a.slug !== excludeSlug) : filtered;
}

export function getArticlesByTag(config: ResolvedCosmoloConfig, tag: string): Article[] {
	return getArticles(config).filter((a) => a.tags.includes(tag));
}

export function getArticlesBySeries(config: ResolvedCosmoloConfig, seriesKey: string): Article[] {
	return getArticles(config)
		.filter((a) => a.series === seriesKey)
		.sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
}

export function getTags(config: ResolvedCosmoloConfig): string[] {
	const tags = new Set<string>();
	getArticles(config).forEach((a) => a.tags.forEach((t) => tags.add(t)));
	return Array.from(tags).sort();
}
