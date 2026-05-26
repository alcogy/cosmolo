import type { Plugin } from 'vite';
import type { CosmoloConfig } from './types.js';
import { resolveConfig } from './config.js';

const VIRTUAL_ID = 'cosmolo:content';
const RESOLVED_ID = '\0cosmolo:content';

/**
 * Vite plugin that generates the `cosmolo:content` virtual module.
 *
 * The virtual module contains `import.meta.glob` calls with the paths derived
 * from the user's CosmoloConfig. Because the glob patterns are string literals
 * inside the generated code, Vite can statically analyze them at build time.
 *
 * Usage in vite.config.ts:
 *   import { cosmoloPlugin } from 'cosmolo/plugin';
 *   plugins: [sveltekit(), cosmoloPlugin({ articlesDir: 'content/articles' })]
 */
export function cosmoloPlugin(userConfig: CosmoloConfig = {}): Plugin {
	const config = resolveConfig(userConfig);

	// Normalize to absolute-root-relative paths (leading slash, no trailing slash)
	const articlesDir = '/' + config.articlesDir.replace(/^\/|\/$/g, '');
	const pagesDir = '/' + config.pagesDir.replace(/^\/|\/$/g, '');

	const virtualModuleCode = `
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
`.trim();

	return {
		name: 'cosmolo',
		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
		},
		load(id) {
			if (id === RESOLVED_ID) return virtualModuleCode;
		},
	};
}
