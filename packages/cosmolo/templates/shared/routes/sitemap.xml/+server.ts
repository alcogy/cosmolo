import { getSlugs, getTags } from 'cosmolo';
import { getCategorySlugs, loadSiteConfig } from 'cosmolo';
import { getPageSlugs } from 'cosmolo';
import config from '../../../cosmolo.config';

export const prerender = true;

export function GET(): Response {
	const siteConfig = loadSiteConfig(config);
	const base = siteConfig.url.replace(/\/$/, '');

	const articleUrls = getSlugs(config).map((slug) => `${base}/articles/${slug}`);
	const categoryUrls = getCategorySlugs(config).map((slug) => `${base}/categories/${slug}`);
	const pageUrls = getPageSlugs(config).map((slug) => `${base}/${slug}`);
	const tagUrls = getTags(config).map((tag) => `${base}/tags/${tag}`);

	const allUrls = [base, ...articleUrls, ...categoryUrls, ...pageUrls, ...tagUrls];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'max-age=0, s-maxage=3600',
		},
	});
}
