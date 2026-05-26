import siteJson from '../../config/site.json';

export interface SiteConfig {
	url: string;
	name: string;
	description: string;
	twitterHandle: string;
	fallbackCategoryLabel: string;
	articlesPerPage: number;
	ogImage: {
		/** "static": use /og-image.png for all pages. "generated": build per-article PNGs via Satori. */
		mode: 'static' | 'generated';
	};
	api: {
		/** Body format included in /api/articles/<slug>.json responses. */
		articleBody: 'html' | 'markdown' | 'plaintext';
	};
}

export const siteConfig: SiteConfig = siteJson as SiteConfig;
