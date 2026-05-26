import { categoriesData, siteConfigData } from 'cosmolo:content';
import type { CategoryEntry, ResolvedCosmoloConfig, SiteConfig } from './types.js';

type CategoriesMap = Record<string, { label: string; description: string }>;

const map = categoriesData as CategoriesMap;

export function getAllCategories(_config: ResolvedCosmoloConfig): CategoryEntry[] {
	return Object.entries(map).map(([slug, { label, description }]) => ({
		slug,
		label,
		description,
	}));
}

export function isKnownCategory(_config: ResolvedCosmoloConfig, key: string): boolean {
	return Object.prototype.hasOwnProperty.call(map, key);
}

export function getCategoryLabel(_config: ResolvedCosmoloConfig, key: string): string {
	if (Object.prototype.hasOwnProperty.call(map, key)) return map[key].label;
	return (siteConfigData as SiteConfig).fallbackCategoryLabel;
}

export function getCategoryDescription(_config: ResolvedCosmoloConfig, key: string): string {
	return map[key]?.description ?? '';
}

export function getCategorySlugs(_config: ResolvedCosmoloConfig): string[] {
	return [...Object.keys(map), 'other'];
}

export function loadSiteConfig(_config: ResolvedCosmoloConfig): SiteConfig {
	return siteConfigData as SiteConfig;
}
