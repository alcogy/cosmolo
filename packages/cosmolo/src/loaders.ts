import { getArticle, getArticles, getArticlesByCategory, getArticlesBySeries, getArticlesByTag, getSlugs, getTags } from './articles.js';
import { getCategorySlugs, getCategoryLabel, getCategoryDescription, loadSiteConfig } from './categories.js';
import { getPage, getPageSlugs } from './pages.js';
import type { Article, ResolvedCosmoloConfig } from './types.js';

/**
 * Factory for the article listing page load function.
 *
 * @example
 * // src/routes/+page.server.ts
 * import { createArticlesLoader } from 'cosmolo';
 * import config from '../../cosmolo.config';
 * export const load = createArticlesLoader(config);
 */
export function createArticlesLoader(config: ResolvedCosmoloConfig) {
	return () => ({
		articles: getArticles(config),
		articlesPerPage: loadSiteConfig(config).articlesPerPage,
	});
}

/**
 * Factory for a single article page load function.
 * Resolves manual related articles, series prev/next, and git updated date.
 *
 * @example
 * // src/routes/articles/[slug]/+page.server.ts
 * import { createArticleLoader } from 'cosmolo';
 * import config from '../../../../cosmolo.config';
 * export const entries = () => getSlugs(config).map(slug => ({ slug }));
 * export const load = createArticleLoader(config);
 */
export function createArticleLoader(
	config: ResolvedCosmoloConfig,
	options: { getUpdatedAt?: (slug: string) => string } = {}
) {
	return async ({ params }: { params: { slug: string } }) => {
		const article = await getArticle(config, params.slug);
		const updatedAt = options.getUpdatedAt?.(params.slug) ?? '';

		let related: Article[];
		if (article.related.length > 0) {
			const all = getArticles(config);
			related = article.related
				.map((s) => all.find((a) => a.slug === s))
				.filter((a): a is Article => a !== undefined)
				.slice(0, 4);
		} else {
			related = getArticlesByCategory(config, article.category, params.slug).slice(0, 4);
		}

		let seriesPrev: Article | null = null;
		let seriesNext: Article | null = null;
		let seriesTotal = 0;
		if (article.series) {
			const seriesArticles = getArticlesBySeries(config, article.series);
			seriesTotal = seriesArticles.length;
			const idx = seriesArticles.findIndex((a) => a.slug === params.slug);
			seriesPrev = idx > 0 ? seriesArticles[idx - 1] : null;
			seriesNext = idx < seriesArticles.length - 1 ? seriesArticles[idx + 1] : null;
		}

		return { article, related, updatedAt, seriesPrev, seriesNext, seriesTotal };
	};
}

/**
 * Factory for the category listing page load function.
 *
 * @example
 * // src/routes/categories/[slug]/+page.server.ts
 * import { createCategoryLoader } from 'cosmolo';
 * import config from '../../../../cosmolo.config';
 * export const entries = () => getCategorySlugs(config).map(slug => ({ slug }));
 * export const load = createCategoryLoader(config);
 */
export function createCategoryLoader(config: ResolvedCosmoloConfig) {
	return ({ params }: { params: { slug: string } }) => {
		const { slug } = params;
		return {
			slug,
			label: getCategoryLabel(config, slug),
			description: getCategoryDescription(config, slug),
			articles: getArticlesByCategory(config, slug),
			articlesPerPage: loadSiteConfig(config).articlesPerPage,
		};
	};
}

/**
 * Factory for the tag listing page load function.
 *
 * @example
 * // src/routes/tags/[tag]/+page.server.ts
 * import { createTagLoader } from 'cosmolo';
 * import config from '../../../../cosmolo.config';
 * export const entries = () => getTags(config).map(tag => ({ tag }));
 * export const load = createTagLoader(config);
 */
export function createTagLoader(config: ResolvedCosmoloConfig) {
	return ({ params }: { params: { tag: string } }) => ({
		tag: params.tag,
		articles: getArticlesByTag(config, params.tag),
		articlesPerPage: loadSiteConfig(config).articlesPerPage,
	});
}

/**
 * Factory for the static page load function.
 *
 * @example
 * // src/routes/(pages)/[slug]/+page.server.ts
 * import { createPageLoader } from 'cosmolo';
 * import config from '../../../../cosmolo.config';
 * export const entries = () => getPageSlugs(config).map(slug => ({ slug }));
 * export const load = createPageLoader(config);
 */
export function createPageLoader(config: ResolvedCosmoloConfig) {
	return async ({ params }: { params: { slug: string } }) => ({
		page: await getPage(config, params.slug),
	});
}

// ─── entries generators ───────────────────────────────────────────────────────

export function createArticleEntries(config: ResolvedCosmoloConfig) {
	return () => getSlugs(config).map((slug) => ({ slug }));
}

export function createCategoryEntries(config: ResolvedCosmoloConfig) {
	return () => getCategorySlugs(config).map((slug) => ({ slug }));
}

export function createTagEntries(config: ResolvedCosmoloConfig) {
	return () => getTags(config).map((tag) => ({ tag }));
}

export function createPageEntries(config: ResolvedCosmoloConfig) {
	return () => getPageSlugs(config).map((slug) => ({ slug }));
}
