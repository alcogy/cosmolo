import { z } from 'zod';
import matter from 'gray-matter';
import { renderMarkdown } from './markdown';
import { isKnownCategory } from './categories';

export const articleFrontmatterSchema = z.object({
	title: z.string(),
	category: z.string(),
	excerpt: z.string(),
	sort: z.number().default(0),
	date: z.preprocess(
		(val) => (val instanceof Date ? val.toISOString().split('T')[0] : val),
		z.string().default('')
	)
});

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;

export interface Article extends ArticleFrontmatter {
	slug: string;
	/** Rendered HTML for .md articles. Empty string for .svx articles. */
	html: string;
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

export function getSlugs(): string[] {
	const slugs = new Set<string>();
	Object.keys(rawMdFiles).forEach((p) => slugs.add(slugFromPath(p)));
	Object.keys(svxModules).forEach((p) => slugs.add(slugFromPath(p)));
	return Array.from(slugs);
}

/** Returns all articles sorted by `sort` descending (higher = first). */
export function getArticles(): Article[] {
	const articles: Article[] = [];

	for (const [path, raw] of Object.entries(rawMdFiles)) {
		const slug = slugFromPath(path);
		const { data } = matter(raw);
		const frontmatter = articleFrontmatterSchema.parse(data);
		articles.push({ ...frontmatter, slug, html: '' });
	}

	for (const [path, mod] of Object.entries(svxModules)) {
		const slug = slugFromPath(path);
		const frontmatter = articleFrontmatterSchema.parse(mod.metadata);
		articles.push({ ...frontmatter, slug, html: '' });
	}

	return articles.sort((a, b) => b.sort - a.sort);
}

/** Returns a single article with rendered HTML (only populated for .md). */
export async function getArticle(slug: string): Promise<Article> {
	const mdPath = `/src/content/articles/${slug}.md`;
	const svxPath = `/src/content/articles/${slug}.svx`;

	if (rawMdFiles[mdPath] !== undefined) {
		const raw = rawMdFiles[mdPath];
		const { data, content } = matter(raw);
		const frontmatter = articleFrontmatterSchema.parse(data);
		const html = await renderMarkdown(content);
		return { ...frontmatter, slug, html };
	}

	if (svxModules[svxPath] !== undefined) {
		const frontmatter = articleFrontmatterSchema.parse(svxModules[svxPath].metadata);
		return { ...frontmatter, slug, html: '' };
	}

	throw new Error(`Article not found: ${slug}`);
}

/**
 * Returns articles belonging to a category slug.
 * The reserved slug 'other' aggregates articles whose category is not in categories.json.
 */
export function getArticlesByCategory(
	categorySlug: string,
	excludeSlug?: string
): Article[] {
	const all = getArticles();
	const filtered =
		categorySlug === 'other'
			? all.filter((a) => !isKnownCategory(a.category))
			: all.filter((a) => a.category === categorySlug);
	return excludeSlug ? filtered.filter((a) => a.slug !== excludeSlug) : filtered;
}
