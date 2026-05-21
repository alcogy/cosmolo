import { getArticle, getArticlesByCategory, getSlugs } from '$lib/articles';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => {
	return getSlugs().map((slug) => ({ slug }));
};

export const load: PageServerLoad = async ({ params }) => {
	try {
		const article = await getArticle(params.slug);
		const related = getArticlesByCategory(article.category, params.slug).slice(0, 4);
		return { article, related };
	} catch {
		error(404, `Article not found: ${params.slug}`);
	}
};
