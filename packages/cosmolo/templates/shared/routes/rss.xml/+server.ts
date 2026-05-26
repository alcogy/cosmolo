import { getArticles, loadSiteConfig } from 'cosmolo';
import config from '../../../cosmolo.config';

export const prerender = true;

function toRfc822(dateStr: string): string {
	if (!dateStr) return new Date().toUTCString();
	return new Date(dateStr).toUTCString();
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function GET(): Response {
	const siteConfig = loadSiteConfig(config);
	const base = siteConfig.url.replace(/\/$/, '');
	const articles = getArticles(config);

	const items = articles
		.map((a) => {
			const url = `${base}/articles/${a.slug}`;
			return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${url}</link>
      <description>${escapeXml(a.excerpt)}</description>
      <pubDate>${toRfc822(a.date)}</pubDate>
      <guid isPermaLink="true">${url}</guid>
    </item>`;
		})
		.join('\n');

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${base}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en</language>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

	return new Response(rss, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'max-age=0, s-maxage=3600',
		},
	});
}
