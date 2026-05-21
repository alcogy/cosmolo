import { getArticlesByCategory } from '$lib/articles';
import { getCategorySlugs, getCategoryLabel, getCategoryDescription } from '$lib/categories';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => {
	return getCategorySlugs().map((slug) => ({ slug }));
};

export const load: PageServerLoad = ({ params }) => {
	const { slug } = params;

	// 'other' is always valid; reject unknown slugs that are not in categories.json
	const validSlugs = getCategorySlugs();
	if (!validSlugs.includes(slug)) {
		error(404, `Category not found: ${slug}`);
	}

	return {
		slug,
		label: getCategoryLabel(slug),
		description: getCategoryDescription(slug),
		articles: getArticlesByCategory(slug)
	};
};
