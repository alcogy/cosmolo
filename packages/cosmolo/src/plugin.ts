import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { Plugin } from 'vite';
import type { CosmoloConfig } from './types.js';
import { resolveConfig } from './config.js';

export { resolveConfig } from './config.js';

function collectArticleSlugs(dir: string): Array<{ filePath: string; slug: string }> {
	const results: Array<{ filePath: string; slug: string }> = [];
	function walk(current: string) {
		for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
			const full = path.join(current, entry.name);
			if (entry.isDirectory()) walk(full);
			else if (/\.(md|svx)$/.test(entry.name)) {
				const slug = path.relative(dir, full).replace(/\.(md|svx)$/, '').replace(/\\/g, '/');
				results.push({ filePath: full, slug });
			}
		}
	}
	walk(dir);
	return results;
}

function gitUpdatedAt(filePath: string, cwd: string): string {
	try {
		const result = execSync(
			`git log -1 --format=%cI -- "${filePath}"`,
			{ encoding: 'utf-8', cwd, stdio: ['ignore', 'pipe', 'ignore'] }
		).trim();
		return result ? result.split('T')[0] : '';
	} catch {
		return '';
	}
}

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

	let isBuild = false;

	return {
		name: 'cosmolo',
		configResolved(resolved) {
			isBuild = resolved.command === 'build';
		},
		config() {
			return {
				ssr: { noExternal: ['cosmolo'] },
			};
		},
		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
		},
		load(id) {
			if (id !== RESOLVED_ID) return;

			this.addWatchFile(categoriesAbsPath);
			this.addWatchFile(siteConfigAbsPath);

			const categoriesData = JSON.parse(fs.readFileSync(categoriesAbsPath, 'utf-8'));
			const siteConfigData = JSON.parse(fs.readFileSync(siteConfigAbsPath, 'utf-8'));

			const articlesDirAbs = path.resolve(process.cwd(), config.articlesDir.replace(/^\//, ''));
			const pagesDirAbs = path.resolve(process.cwd(), config.pagesDir.replace(/^\//, ''));
			const articlesExist = fs.existsSync(articlesDirAbs);
			const pagesExist = fs.existsSync(pagesDirAbs);

			const rawMdFilesExpr = articlesExist
				? `import.meta.glob('${articlesDir}/**/*.md', { query: '?raw', import: 'default', eager: true })`
				: '{}';
			const svxModulesExpr = articlesExist
				? `import.meta.glob('${articlesDir}/**/*.svx', { eager: true })`
				: '{}';
			const rawPageFilesExpr = pagesExist
				? `import.meta.glob('${pagesDir}/**/*.md', { query: '?raw', import: 'default', eager: true })`
				: '{}';

			// Compute git updated-at dates at build time only (skipped in dev for speed)
			const updatedAtMap: Record<string, string> = {};
			if (isBuild && articlesExist) {
				const cwd = process.cwd();
				for (const { filePath, slug } of collectArticleSlugs(articlesDirAbs)) {
					updatedAtMap[slug] = gitUpdatedAt(filePath, cwd);
				}
			}

			return `
export const rawMdFiles = ${rawMdFilesExpr};
export const svxModules = ${svxModulesExpr};
export const rawPageFiles = ${rawPageFilesExpr};
export const categoriesData = ${JSON.stringify(categoriesData)};
export const siteConfigData = ${JSON.stringify(siteConfigData)};
export const updatedAtMap = ${JSON.stringify(updatedAtMap)};
`.trim();
		},
	};
}
