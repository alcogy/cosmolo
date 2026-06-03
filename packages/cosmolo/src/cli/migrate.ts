import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_CONFIG } from '../config.js';
import type { ResolvedCosmoloConfig } from '../types.js';

async function loadConfig(): Promise<ResolvedCosmoloConfig> {
	const root = process.cwd();
	for (const name of ['cosmolo.config.ts', 'cosmolo.config.js']) {
		const p = path.join(root, name);
		if (fs.existsSync(p)) {
			try {
				const mod = await import(p);
				return mod.default as ResolvedCosmoloConfig;
			} catch {
				// fall through to defaults
			}
		}
	}
	return DEFAULT_CONFIG;
}

function ask(rl: readline.Interface, question: string): Promise<string> {
	return new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));
}

export async function main(): Promise<void> {
	const config = await loadConfig();

	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

	console.log('\ncosmolo migrate:db\n');
	console.log('Select migration type:');
	console.log('  1. Export as SQL files');
	console.log('  2. Execute SQL directly');
	console.log('  3. Full setup with Drizzle ORM + Cloudflare D1');

	const choice = await ask(rl, '\n> ');
	rl.close();

	switch (choice) {
		case '1': {
			const { exportSqlFiles } = await import('./migrate/sql-export.js');
			await exportSqlFiles(config);
			break;
		}
		case '2': {
			const { executeSqlDirect } = await import('./migrate/sql-execute.js');
			await executeSqlDirect(config);
			break;
		}
		case '3': {
			const { drizzleSetup } = await import('./migrate/drizzle-setup.js');
			await drizzleSetup(config);
			break;
		}
		default:
			console.error(`\nInvalid choice: "${choice}". Enter 1, 2, or 3.`);
			process.exit(1);
	}
}
