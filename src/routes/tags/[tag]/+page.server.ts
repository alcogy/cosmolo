import { getArticlesByTag, getTagSlugs } from '$lib/articles';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => {
	return getTagSlugs().map((tag) => ({ tag }));
};

export const load: PageServerLoad = ({ params }) => {
	const { tag } = params;
	const articles = getArticlesByTag(tag);

	if (articles.length === 0) {
		error(404, `No articles found for tag: ${tag}`);
	}

	return { tag, articles };
};
