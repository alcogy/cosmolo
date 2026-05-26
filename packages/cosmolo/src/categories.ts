import fs from 'fs';
import path from 'path';
import type { CategoryEntry, ResolvedCosmoloConfig, SiteConfig } from './types.js';

type CategoriesMap = Record<string, { label: string; description: string }>;

function readCategoriesMap(config: ResolvedCosmoloConfig): CategoriesMap {
	const raw = fs.readFileSync(path.resolve(config.categoriesConfigPath), 'utf-8');
	return JSON.parse(raw) as CategoriesMap;
}

export function getAllCategories(config: ResolvedCosmoloConfig): CategoryEntry[] {
	const map = readCategoriesMap(config);
	return Object.entries(map).map(([slug, { label, description }]) => ({
		slug,
		label,
		description,
	}));
}

export function isKnownCategory(config: ResolvedCosmoloConfig, key: string): boolean {
	const map = readCategoriesMap(config);
	return Object.prototype.hasOwnProperty.call(map, key);
}

export function getCategoryLabel(config: ResolvedCosmoloConfig, key: string): string {
	const map = readCategoriesMap(config);
	if (Object.prototype.hasOwnProperty.call(map, key)) return map[key].label;
	const siteConfig = loadSiteConfig(config);
	return siteConfig.fallbackCategoryLabel;
}

export function getCategoryDescription(config: ResolvedCosmoloConfig, key: string): string {
	const map = readCategoriesMap(config);
	return map[key]?.description ?? '';
}

export function getCategorySlugs(config: ResolvedCosmoloConfig): string[] {
	return [...Object.keys(readCategoriesMap(config)), 'other'];
}

export function loadSiteConfig(config: ResolvedCosmoloConfig): SiteConfig {
	const raw = fs.readFileSync(path.resolve(config.siteConfigPath), 'utf-8');
	return JSON.parse(raw) as SiteConfig;
}
