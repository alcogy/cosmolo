import { getArticle, getSlugs } from '$lib/articles';
import { getCategoryLabel } from '$lib/categories';
import { siteConfig } from '$lib/config';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return getSlugs().map((slug) => ({ slug }));
};

function markdownToPlainText(markdown: string): string {
	return markdown
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/\*\*(.+?)\*\*/g, '$1')
		.replace(/\*(.+?)\*/g, '$1')
		.replace(/__(.+?)__/g, '$1')
		.replace(/_(.+?)_/g, '$1')
		.replace(/```[\s\S]+?```/g, '')
		.replace(/`(.+?)`/g, '$1')
		.replace(/\[(.+?)\]\(.+?\)/g, '$1')
		.replace(/^[>*-]\s+/gm, '')
		.replace(/^\s*\|.+\|\s*$/gm, '')
		.replace(/::\w+\[[^\]]*\]/g, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export const GET: RequestHandler = async ({ params }) => {
	try {
		const article = await getArticle(params.slug);
		const base = siteConfig.url.replace(/\/$/, '');
		const format = siteConfig.api.articleBody;

		let contents: string;
		if (format === 'markdown') {
			contents = article.markdown;
		} else if (format === 'plaintext') {
			contents = markdownToPlainText(article.markdown);
		} else {
			contents = article.html;
		}

		const body = {
			slug: article.slug,
			title: article.title,
			excerpt: article.excerpt,
			category: article.category,
			categoryLabel: getCategoryLabel(article.category),
			tags: article.tags,
			series: article.series ?? null,
			seriesOrder: article.seriesOrder ?? null,
			date: article.date,
			sort: article.sort,
			related: article.related,
			contentsFormat: format,
			contents,
			url: `${base}/articles/${article.slug}`
		};

		return new Response(JSON.stringify(body, null, 2), {
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'max-age=0, s-maxage=3600'
			}
		});
	} catch {
		error(404, `Article not found: ${params.slug}`);
	}
};
