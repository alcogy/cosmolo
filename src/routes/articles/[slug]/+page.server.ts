import { getArticle, getArticles, getArticlesByCategory, getArticlesBySeries, getSlugs } from '$lib/articles';
import type { Article } from '$lib/articles';
import { error } from '@sveltejs/kit';
import { execSync } from 'child_process';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => {
	return getSlugs().map((slug) => ({ slug }));
};

function getGitUpdatedAt(slug: string): string {
	for (const ext of ['md', 'svx']) {
		try {
			const result = execSync(
				`git log -1 --format=%cI -- "src/content/articles/${slug}.${ext}"`,
				{ encoding: 'utf-8' }
			).trim();
			if (result) return result.split('T')[0];
		} catch {
			// git not available or file not tracked
		}
	}
	return '';
}

export const load: PageServerLoad = async ({ params }) => {
	try {
		const article = await getArticle(params.slug);
		const updatedAt = getGitUpdatedAt(params.slug);

		// Manual related overrides auto-detection
		let related: Article[];
		if (article.related.length > 0) {
			const allArticles = getArticles();
			related = article.related
				.map((slug) => allArticles.find((a) => a.slug === slug))
				.filter((a): a is Article => a !== undefined)
				.slice(0, 4);
		} else {
			related = getArticlesByCategory(article.category, params.slug).slice(0, 4);
		}

		// Series prev/next
		let seriesPrev: Article | null = null;
		let seriesNext: Article | null = null;
		let seriesTotal = 0;
		if (article.series) {
			const seriesArticles = getArticlesBySeries(article.series);
			seriesTotal = seriesArticles.length;
			const idx = seriesArticles.findIndex((a) => a.slug === params.slug);
			seriesPrev = idx > 0 ? seriesArticles[idx - 1] : null;
			seriesNext = idx < seriesArticles.length - 1 ? seriesArticles[idx + 1] : null;
		}

		return { article, related, updatedAt, seriesPrev, seriesNext, seriesTotal };
	} catch {
		error(404, `Article not found: ${params.slug}`);
	}
};
