declare module 'cosmolo:content' {
	const rawMdFiles: Record<string, string>;
	const svxModules: Record<string, { metadata: Record<string, unknown>; default: unknown }>;
	const rawPageFiles: Record<string, string>;
	const categoriesData: Record<string, { label: string; description: string }>;
	const siteConfigData: import('./types.js').SiteConfig;
	/** slug → ISO date string (YYYY-MM-DD). Computed from git at build time; empty string in dev mode or when git is unavailable. */
	const updatedAtMap: Record<string, string>;
	export { rawMdFiles, svxModules, rawPageFiles, categoriesData, siteConfigData, updatedAtMap };
}
