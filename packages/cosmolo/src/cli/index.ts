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
	case 'migrate:db':
		await (await import('./migrate.js')).main();
		break;
	case 'setup:r2':
		await (await import('./setup/r2.js')).main();
		break;
	default: {
		const isUnknown = Boolean(cmd);
		if (isUnknown) console.error(`Unknown command: ${cmd}\n`);
		console.log('Usage: cosmolo <command>\n');
		console.log('Commands:');
		console.log('  init                             Scaffold routes and config into a SvelteKit project');
		console.log('  generate [article|page|category] Create content files');
		console.log('  migrate:db                       Migrate file-based content to a database (D1)');
		console.log('  setup:r2                         Add Cloudflare R2 bucket for asset storage');
		process.exit(isUnknown ? 1 : 0);
	}
}
