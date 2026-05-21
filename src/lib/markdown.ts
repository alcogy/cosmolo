import { marked } from 'marked';

// YouTube block embed: ::youtube[videoId]
marked.use({
	extensions: [
		{
			name: 'youtube',
			level: 'block',
			start(src: string) {
				return src.indexOf('::youtube[');
			},
			tokenizer(src: string) {
				const match = /^::youtube\[([^\]]+)\]/.exec(src);
				if (match) {
					return { type: 'youtube', raw: match[0], videoId: match[1].trim() };
				}
			},
			renderer(token: { videoId: string }) {
				return `<div class="youtube-embed"><iframe src="https://www.youtube.com/embed/${token.videoId}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\n`;
			}
		}
	]
});

// Append target/_blank to external links
marked.use({
	renderer: {
		link({ href, title, text }: { href: string; title?: string | null; text: string }) {
			const isExternal = /^https?:\/\//.test(href ?? '');
			const rel = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
			const titleAttr = title ? ` title="${title}"` : '';
			return `<a href="${href}"${titleAttr}${rel}>${text}</a>`;
		}
	}
});

export async function renderMarkdown(content: string): Promise<string> {
	return marked.parse(content);
}
