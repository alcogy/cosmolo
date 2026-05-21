import { getArticles } from '$lib/articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	return {
		articles: getArticles()
	};
};
