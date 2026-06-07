import { createArticleLoader, createArticleEntries } from 'cosmolo';
import config from '../../../../cosmolo.config';

// To show a git-based "updated" date (SSG / Node.js only — not Cloudflare Workers):
// import { execSync } from 'child_process';
// export const load = createArticleLoader(config, {
//   getUpdatedAt(slug) {
//     try {
//       return execSync(
//         `git log -1 --format=%cI -- "src/content/articles/${slug}.md"`,
//         { encoding: 'utf-8' }
//       ).trim().split('T')[0];
//     } catch { return ''; }
//   },
// });

export const entries = createArticleEntries(config);
export const load = createArticleLoader(config);
