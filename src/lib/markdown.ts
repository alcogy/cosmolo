import { marked } from 'marked';

export interface TocEntry {
	level: number;
	id: string;
	text: string;
}

function slugifyHeading(text: string): string {
	return text
		.toLowerCase()
		.replace(/<[^>]+>/g, '')
		.replace(/[^\w\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');
}

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
			renderer(token) {
				const { videoId } = token as unknown as { videoId: string };
				return `<div class="youtube-embed"><iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\n`;
			}
		}
	]
});

// External link targeting; heading IDs for anchor links
marked.use({
	renderer: {
		link({ href, title, text }: { href: string; title?: string | null; text: string }) {
			const isExternal = /^https?:\/\//.test(href ?? '');
			const rel = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
			const titleAttr = title ? ` title="${title}"` : '';
			return `<a href="${href}"${titleAttr}${rel}>${text}</a>`;
		},
		heading({ text, depth }: { text: string; depth: number }) {
			const id = slugifyHeading(text);
			return `<h${depth} id="${id}">${text}</h${depth}>\n`;
		}
	}
});

export async function renderMarkdown(content: string): Promise<string> {
	return marked.parse(content);
}

export function generateToc(content: string): TocEntry[] {
	const entries: TocEntry[] = [];
	const seenIds = new Map<string, number>();
	const headingRegex = /^(#{2,6})\s+(.+?)$/gm;
	let match;
	while ((match = headingRegex.exec(content)) !== null) {
		const level = match[1].length;
		const rawText = match[2].trim();
		const plainText = rawText
			.replace(/\*\*([^*]+)\*\*/g, '$1')
			.replace(/\*([^*]+)\*/g, '$1')
			.replace(/__([^_]+)__/g, '$1')
			.replace(/_([^_]+)_/g, '$1')
			.replace(/`([^`]+)`/g, '$1')
			.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
		const baseId = slugifyHeading(plainText);
		const count = seenIds.get(baseId) ?? 0;
		const id = count === 0 ? baseId : `${baseId}-${count}`;
		seenIds.set(baseId, count + 1);
		entries.push({ level, id, text: plainText });
	}
	return entries;
}
