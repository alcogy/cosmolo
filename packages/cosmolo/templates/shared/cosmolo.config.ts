import { resolveConfig } from 'cosmolo/plugin';

const config = resolveConfig({
	articlesDir: 'src/content/articles',
	pagesDir: 'src/content/pages',
	siteConfigPath: 'config/site.json',
	categoriesConfigPath: 'config/categories.json',
});

export default config;
