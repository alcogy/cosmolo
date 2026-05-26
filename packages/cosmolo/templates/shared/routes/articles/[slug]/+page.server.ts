import { createArticleLoader, createArticleEntries } from 'cosmolo';
import { execSync } from 'child_process';
import config from '../../../../cosmolo.config';

function getUpdatedAt(slug: string): string {
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

export const entries = createArticleEntries(config);
export const load = createArticleLoader(config, { getUpdatedAt });
