import { getArticle, getArticlesByCategory, getSlugs } from '$lib/articles';
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
		const related = getArticlesByCategory(article.category, params.slug).slice(0, 4);
		const updatedAt = getGitUpdatedAt(params.slug);
		return { article, related, updatedAt };
	} catch {
		error(404, `Article not found: ${params.slug}`);
	}
};
