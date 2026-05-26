import { z } from 'zod';
import matter from 'gray-matter';
import { renderMarkdown, generateToc } from './markdown';
import type { TocEntry } from './markdown';
import { isKnownCategory } from './categories';

export type { TocEntry };

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
	related: z.array(z.string()).default([])
});

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;

export interface Article extends ArticleFrontmatter {
	slug: string;
	/** Rendered HTML for .md articles. Empty string for .svx articles. */
	html: string;
	/** Raw Markdown body (without frontmatter) for .md articles. Empty string for .svx articles. */
	markdown: string;
	/** Table of contents entries. Populated only for .md articles via getArticle(). */
	toc: TocEntry[];
}

// Resolved at build time by Vite
const rawMdFiles = import.meta.glob('/src/content/articles/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const svxModules = import.meta.glob('/src/content/articles/*.svx', {
	eager: true
}) as Record<string, { metadata: Record<string, unknown>; default: unknown }>;

function slugFromPath(path: string): string {
	return path.replace(/^\/src\/content\/articles\//, '').replace(/\.(md|svx)$/, '');
}

/** Returns all non-draft article slugs. */
export function getSlugs(): string[] {
	return getArticles().map((a) => a.slug);
}

/** Returns all non-draft articles sorted by `sort` descending (higher = first). */
export function getArticles(): Article[] {
	const articles: Article[] = [];

	for (const [path, raw] of Object.entries(rawMdFiles)) {
		const slug = slugFromPath(path);
		const { data } = matter(raw);
		const frontmatter = articleFrontmatterSchema.parse(data);
		if (frontmatter.draft) continue;
		articles.push({ ...frontmatter, slug, html: '', markdown: '', toc: [] });
	}

	for (const [path, mod] of Object.entries(svxModules)) {
		const slug = slugFromPath(path);
		const frontmatter = articleFrontmatterSchema.parse(mod.metadata);
		if (frontmatter.draft) continue;
		articles.push({ ...frontmatter, slug, html: '', markdown: '', toc: [] });
	}

	return articles.sort((a, b) => b.sort - a.sort);
}

/** Returns a single article with rendered HTML and TOC (draft articles included). */
export async function getArticle(slug: string): Promise<Article> {
	const mdPath = `/src/content/articles/${slug}.md`;
	const svxPath = `/src/content/articles/${slug}.svx`;

	if (rawMdFiles[mdPath] !== undefined) {
		const raw = rawMdFiles[mdPath];
		const { data, content } = matter(raw);
		const frontmatter = articleFrontmatterSchema.parse(data);
		const html = await renderMarkdown(content);
		const toc = generateToc(content);
		return { ...frontmatter, slug, html, markdown: content, toc };
	}

	if (svxModules[svxPath] !== undefined) {
		const frontmatter = articleFrontmatterSchema.parse(svxModules[svxPath].metadata);
		return { ...frontmatter, slug, html: '', markdown: '', toc: [] };
	}

	throw new Error(`Article not found: ${slug}`);
}

/**
 * Returns articles belonging to a category slug.
 * The reserved slug 'other' aggregates articles whose category is not in categories.json.
 */
export function getArticlesByCategory(categorySlug: string, excludeSlug?: string): Article[] {
	const all = getArticles();
	const filtered =
		categorySlug === 'other'
			? all.filter((a) => !isKnownCategory(a.category))
			: all.filter((a) => a.category === categorySlug);
	return excludeSlug ? filtered.filter((a) => a.slug !== excludeSlug) : filtered;
}

export function getArticlesByTag(tag: string): Article[] {
	return getArticles().filter((a) => a.tags.includes(tag));
}

/** Returns articles in a series, sorted by seriesOrder ascending. */
export function getArticlesBySeries(seriesKey: string): Article[] {
	return getArticles()
		.filter((a) => a.series === seriesKey)
		.sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
}

/** Returns all unique tags across all non-draft articles. */
export function getTags(): string[] {
	const tags = new Set<string>();
	getArticles().forEach((a) => a.tags.forEach((t) => tags.add(t)));
	return Array.from(tags).sort();
}

export function getTagSlugs(): string[] {
	return getTags();
}
