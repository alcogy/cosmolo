declare module 'cosmolo:content' {
	const rawMdFiles: Record<string, string>;
	const svxModules: Record<string, { metadata: Record<string, unknown>; default: unknown }>;
	const rawPageFiles: Record<string, string>;
	const categoriesData: Record<string, { label: string; description: string }>;
	const siteConfigData: import('./types.js').SiteConfig;
	export { rawMdFiles, svxModules, rawPageFiles, categoriesData, siteConfigData };
}
