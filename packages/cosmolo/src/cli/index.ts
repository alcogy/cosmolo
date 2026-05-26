#!/usr/bin/env bun
export {};

const cmd = process.argv[2];

switch (cmd) {
	case 'init':
		await (await import('./init.js')).main();
		break;
	case 'generate':
		await (await import('./generate.js')).main();
		break;
	default: {
		const isUnknown = Boolean(cmd);
		if (isUnknown) console.error(`Unknown command: ${cmd}\n`);
		console.log('Usage: cosmolo <command>\n');
		console.log('Commands:');
		console.log('  init                             Scaffold routes into an existing SvelteKit project');
		console.log('  generate [article|page|category] Create content files');
		process.exit(isUnknown ? 1 : 0);
	}
}
