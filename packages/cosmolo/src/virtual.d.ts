declare module 'cosmolo:content' {
	const rawMdFiles: Record<string, string>;
	const svxModules: Record<string, { metadata: Record<string, unknown>; default: unknown }>;
	const rawPageFiles: Record<string, string>;
	export { rawMdFiles, svxModules, rawPageFiles };
}
