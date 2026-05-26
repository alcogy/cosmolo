import type { CosmoloConfig, ResolvedCosmoloConfig } from './types.js';

export const DEFAULT_CONFIG: ResolvedCosmoloConfig = {
	articlesDir: 'src/content/articles',
	pagesDir: 'src/content/pages',
	siteConfigPath: 'config/site.json',
	categoriesConfigPath: 'config/categories.json',
};

export function resolveConfig(userConfig: CosmoloConfig = {}): ResolvedCosmoloConfig {
	return { ...DEFAULT_CONFIG, ...userConfig };
}
