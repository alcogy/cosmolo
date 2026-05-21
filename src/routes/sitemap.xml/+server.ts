import { getSlugs } from '$lib/articles';
import { getCategorySlugs } from '$lib/categories';
import { siteConfig } from '$lib/config';
import { getPageSlugs } from '$lib/pages';

export const prerender = true;

export function GET(): Response {
	const base = siteConfig.url.replace(/\/$/, '');

	const articleUrls = getSlugs().map((slug) => `${base}/articles/${slug}`);
	const categoryUrls = getCategorySlugs().map((slug) => `${base}/categories/${slug}`);
	const pageUrls = getPageSlugs().map((slug) => `${base}/${slug}`);

	const allUrls = [base, ...articleUrls, ...categoryUrls, ...pageUrls];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
}
