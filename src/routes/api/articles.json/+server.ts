import { getArticles } from '$lib/articles';

export const prerender = true;

export function GET(): Response {
	const articles = getArticles().map((a) => ({
		slug: a.slug,
		title: a.title
	}));

	return new Response(JSON.stringify({ articles }, null, 2), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
}
