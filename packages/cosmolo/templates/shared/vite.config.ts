import { sveltekit } from '@sveltejs/kit/vite';
import { cosmoloPlugin } from 'cosmolo/plugin';
import { defineConfig } from 'vite';
import config from './cosmolo.config';

export default defineConfig({
	plugins: [sveltekit(), cosmoloPlugin(config)],
});
