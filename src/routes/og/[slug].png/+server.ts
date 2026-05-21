import { getArticle, getSlugs } from '$lib/articles';
import { getCategoryLabel } from '$lib/categories';
import { siteConfig } from '$lib/config';
import { renderOgImage } from '$lib/og';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	if (siteConfig.ogImage.mode !== 'generated') return [];
	return getSlugs().map((slug) => ({ slug }));
};

export const GET: RequestHandler = async ({ params }) => {
	let title: string;
	let category: string | undefined;

	try {
		const article = await getArticle(params.slug);
		title = article.title;
		category = getCategoryLabel(article.category);
	} catch {
		error(404, `Article not found: ${params.slug}`);
	}

	const png = await renderOgImage(title, category);

	return new Response(png, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=31536000, immutable'
		}
	});
};
