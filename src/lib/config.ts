import siteJson from '../../config/site.json';

export interface SiteConfig {
	url: string;
	name: string;
	description: string;
	twitterHandle: string;
	fallbackCategoryLabel: string;
	ogImage: {
		/** "static": use /og-image.png for all pages. "generated": build per-article PNGs via Satori. */
		mode: 'static' | 'generated';
	};
}

export const siteConfig: SiteConfig = siteJson;
