import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import type { CosmoloConfig } from './types.js';
import { resolveConfig } from './config.js';

const VIRTUAL_ID = 'cosmolo:content';
const RESOLVED_ID = '\0cosmolo:content';

/**
 * Vite plugin that generates the `cosmolo:content` virtual module.
 *
 * Content files are bundled via `import.meta.glob` (evaluated at build time).
 * JSON config files (categories, site config) are inlined as object literals so
 * the runtime code has no `fs` dependency — required for Cloudflare Workers and
 * other serverless runtimes.
 *
 * Usage in vite.config.ts:
 *   import { cosmoloPlugin } from 'cosmolo/plugin';
 *   plugins: [sveltekit(), cosmoloPlugin({ articlesDir: 'content/articles' })]
 */
export function cosmoloPlugin(userConfig: CosmoloConfig = {}): Plugin {
	const config = resolveConfig(userConfig);

	const articlesDir = '/' + config.articlesDir.replace(/^\/|\/$/g, '');
	const pagesDir = '/' + config.pagesDir.replace(/^\/|\/$/g, '');

	const categoriesAbsPath = path.resolve(process.cwd(), config.categoriesConfigPath);
	const siteConfigAbsPath = path.resolve(process.cwd(), config.siteConfigPath);

	return {
		name: 'cosmolo',
		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
		},
		load(id) {
			if (id !== RESOLVED_ID) return;

			this.addWatchFile(categoriesAbsPath);
			this.addWatchFile(siteConfigAbsPath);

			const categoriesData = JSON.parse(fs.readFileSync(categoriesAbsPath, 'utf-8'));
			const siteConfigData = JSON.parse(fs.readFileSync(siteConfigAbsPath, 'utf-8'));

			return `
export const rawMdFiles = import.meta.glob(
  '${articlesDir}/*.md',
  { query: '?raw', import: 'default', eager: true }
);

export const svxModules = import.meta.glob(
  '${articlesDir}/*.svx',
  { eager: true }
);

export const rawPageFiles = import.meta.glob(
  '${pagesDir}/*.md',
  { query: '?raw', import: 'default', eager: true }
);

export const categoriesData = ${JSON.stringify(categoriesData)};

export const siteConfigData = ${JSON.stringify(siteConfigData)};
`.trim();
		},
	};
}
