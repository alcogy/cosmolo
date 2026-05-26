import { getAllCategories } from '$lib/categories';
import { siteConfig } from '$lib/config';

export const prerender = true;

export function GET(): Response {
	const base = siteConfig.url.replace(/\/$/, '');
	const categories = getAllCategories().map((c) => ({
		...c,
		url: `${base}/categories/${c.slug}`
	}));

	return new Response(JSON.stringify({ categories }, null, 2), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
}
