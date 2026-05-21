import categoriesJson from '../../config/categories.json';
import { siteConfig } from './config';

export interface CategoryEntry {
	slug: string;
	label: string;
	description: string;
}

type CategoriesMap = Record<string, { label: string; description: string }>;

const categoriesMap: CategoriesMap = categoriesJson;

export function getAllCategories(): CategoryEntry[] {
	return Object.entries(categoriesMap).map(([slug, { label, description }]) => ({
		slug,
		label,
		description
	}));
}

export function isKnownCategory(key: string): boolean {
	return Object.prototype.hasOwnProperty.call(categoriesMap, key);
}

export function getCategoryLabel(key: string): string {
	if (isKnownCategory(key)) {
		return categoriesMap[key].label;
	}
	return siteConfig.fallbackCategoryLabel;
}

export function getCategoryDescription(key: string): string {
	if (isKnownCategory(key)) {
		return categoriesMap[key].description;
	}
	return '';
}

/** Returns all known category slugs plus the reserved 'other' fallback slug. */
export function getCategorySlugs(): string[] {
	return [...Object.keys(categoriesMap), 'other'];
}
