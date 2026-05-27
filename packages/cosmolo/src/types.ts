// ─── Package configuration ────────────────────────────────────────────────────

export interface CosmoloConfig {
	/** Directory containing article files (.md, .svx). @default 'src/content/articles' */
	articlesDir?: string;
	/** Directory containing static page files (.md). @default 'src/content/pages' */
	pagesDir?: string;
	/** Path to site configuration JSON. @default 'config/site.json' */
	siteConfigPath?: string;
	/** Path to categories configuration JSON. @default 'config/categories.json' */
	categoriesConfigPath?: string;
}

export type ResolvedCosmoloConfig = Required<CosmoloConfig>;

// ─── Content types ────────────────────────────────────────────────────────────

export interface TocEntry {
	level: number;
	id: string;
	text: string;
}

export interface ArticleFrontmatter {
	title: string;
	category: string;
	excerpt: string;
	sort: number;
	date: string;
	tags: string[];
	series?: string;
	seriesOrder?: number;
	draft: boolean;
	related: string[];
}

export interface Article extends ArticleFrontmatter {
	slug: string;
	html: string;
	markdown: string;
	toc: TocEntry[];
}

export interface Page {
	slug: string;
	title: string;
	html: string;
}

export interface CategoryEntry {
	slug: string;
	label: string;
	description: string;
}

export interface SiteConfig {
	url: string;
	name: string;
	description: string;
	twitterHandle: string;
	fallbackCategoryLabel: string;
	articlesPerPage: number;
	ogImage: { mode: 'static' | 'generated' };
}
