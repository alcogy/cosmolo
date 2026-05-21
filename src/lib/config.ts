import siteJson from '../../config/site.json';

export interface SiteConfig {
	url: string;
	name: string;
	description: string;
	twitterHandle: string;
	fallbackCategoryLabel: string;
}

export const siteConfig: SiteConfig = siteJson;
