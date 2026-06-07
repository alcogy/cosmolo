# Cosmolo

A SvelteKit-native content management package — add Markdown-based blogging to any SvelteKit project in minutes.

**Website:** https://cosmolo.alcogy.dev

> **Name origin**: Short for *cosmologist* — a deliberate nod to Astro. Cosmolo occupies
> a similar content-site niche but stays entirely within the SvelteKit ecosystem.

---

## Why Cosmolo

Astro is a great product — but for SvelteKit developers it's a heavy choice.
Switching frameworks means leaving behind the Svelte component model, the SvelteKit
router, and all the ecosystem knowledge you've built up. Cosmolo gives SvelteKit
a canonical "just add Markdown and go" story without asking you to leave.

| | Cosmolo | Astro | Nuxt Content | SvelteKit (vanilla) |
|---|---|---|---|---|
| Framework | SvelteKit | Astro | Nuxt (Vue) | SvelteKit |
| Markdown | MDSveX + marked | Built-in | Built-in | Manual |
| Type-safe frontmatter | Zod | TS inference | Zod (optional) | Manual |
| Component in Markdown | Yes (.svx) | Yes (.mdx) | Yes | No |
| Config-driven categories | Yes | No | No | No |
| Headless CMS (JSON API) | Yes | Manual | Manual | Manual |
| DB migration path | `migrate:db` | No | No | Manual |
| Learning curve | SvelteKit only | Astro concepts | Vue + Nuxt | SvelteKit only |

**Core principles:**

1. **SvelteKit all the way down** — No framework switching. Developers who know SvelteKit already know Cosmolo.
2. **Config over convention** — Site identity and taxonomy are JSON files. No source code changes needed to add a category.
3. **Type-safe content** — Frontmatter is validated with Zod at build time. Malformed articles fail loudly during `bun build`.
4. **MDSveX as a first-class citizen** — `.md` and `.svx` share the same routing and Zod schema; the system auto-detects which to use.
5. **Headless-ready** — Cosmolo generates static JSON endpoints alongside your HTML pages, so your content can be consumed by external apps or frontends without any server.
6. **Non-invasive** — Cosmolo is an npm package, not a framework. It adds content management to your existing project without owning your routes or components.

---

## Quick Start

```bash
# In an existing SvelteKit project:
bun add cosmolo

# Scaffold routes and config files interactively
bunx cosmolo init

# Start writing content
bun generate:article

# Run the dev server
bun dev
```

`cosmolo init` asks two questions — which mode (Full or Slim) and which adapter (SSG, Cloudflare, or Serverless) — then copies the appropriate route files into your project.

---

## Configuration

### `config/site.json`

Site-wide settings. Created by `cosmolo init`.

| Field | Description |
|---|---|
| `url` | Production URL (used in sitemap and OGP) |
| `name` | Site name shown in header and `<title>` |
| `description` | Default meta description |
| `twitterHandle` | Twitter/X handle for `twitter:site` meta tag |
| `fallbackCategoryLabel` | Label shown for the `other` fallback category |
| `articlesPerPage` | Articles per page for pagination |

```json
{
  "url": "https://your-site.example.com",
  "name": "Your Site Name",
  "description": "A content site built with Cosmolo.",
  "twitterHandle": "@yourhandle",
  "fallbackCategoryLabel": "Other",
  "articlesPerPage": 10
}
```

### `config/categories.json`

Define your content taxonomy. Each key becomes a URL slug at `/categories/<key>`.

```json
{
  "tech": {
    "label": "Technology",
    "description": "Articles about software, tools, and the web."
  },
  "design": {
    "label": "Design",
    "description": "Articles about UI/UX and visual design."
  }
}
```

Articles with an unrecognized category fall back to `/categories/other` automatically.

---

## Content

### Article Frontmatter

Every article needs these fields at the top of the file:

```yaml
---
title: "My Article Title"
category: "tech"                  # must match a key in config/categories.json
excerpt: "One sentence shown in article listings."
sort: 100                         # higher number = appears earlier in listings
date: "2025-01-15"                # ISO date string (optional)
tags: ["svelte", "tutorial"]      # optional — tag listing pages at /tags/<tag>
series: "getting-started"         # optional — groups articles into a series
seriesOrder: 1                    # optional — position within the series (1-based)
draft: true                       # optional — exclude from build output and listings
related: ["slug-a", "slug-b"]     # optional — override auto-detected related articles
---
```

`sort` gives you manual ordering without relying on file timestamps or alphabetical order.
Articles with an unknown `category` value are grouped under `/categories/other`.

### Updated date

Each article page automatically shows an "Updated:" date derived from the file's
**last git commit timestamp**. No frontmatter change is needed — the date is resolved
at build time by running `git log -1` against the article file.

The updated date is displayed only when it differs from the `date` field. If the file
has never been committed, the updated date is omitted silently.

> **Note:** file modification times (`mtime`) are intentionally not used. They reset on
> `git clone`, which makes them unreliable in CI/CD environments.

### Draft mode

Add `draft: true` to any article's frontmatter to exclude it from build output and all listings.
Draft articles are invisible in production but accessible during `bun dev` via their direct URL.

### Tags

Articles can have multiple tags. Each tag gets a listing page at `/tags/<tag>`.

```yaml
tags: ["svelte", "tutorial"]
```

Tags are case-sensitive. Unused tags produce no page.

### Series

Group related articles into an ordered sequence. Prev/next navigation is shown inside each article.

```yaml
series: "getting-started"
seriesOrder: 1
```

All articles sharing the same `series` value are linked together, sorted by `seriesOrder` ascending.

### Manual related articles

By default, the "More in this category" panel shows up to 4 articles from the same category.
Override it by listing slugs explicitly:

```yaml
related: ["slug-a", "slug-b"]
```

### Table of contents

For `.md` articles with 2 or more `##` headings, a table of contents is automatically rendered
above the article body. Heading levels `##` through `######` are included. `.svx` articles do
not get an auto-generated TOC.

### Supported file formats

| Extension | Renderer | Svelte components in body |
|-----------|----------|---------------------------|
| `.md`     | `marked` | No                        |
| `.svx`    | MDSveX   | Yes                       |

Place files in `src/content/articles/` (or your configured `articlesDir`).
The filename becomes the URL slug:

```
src/content/articles/my-post.md  →  /articles/my-post
src/content/articles/demo.svx    →  /articles/demo
```

### Markdown extensions

**YouTube embed** — renders a responsive 16:9 iframe:

```
::youtube[dQw4w9WgXcQ]
```

**External links** — all `http://` and `https://` links automatically get
`target="_blank" rel="noopener noreferrer"`.

### Svelte components in `.svx`

`.svx` files are Markdown with embedded Svelte components. Use them when articles
need interactive UI.

```svx
<script>
  import Callout from '$lib/components/Callout.svelte';
</script>

<Callout type="warning">Watch out for this edge case.</Callout>
```

### Static Pages

Place `.md` files in `src/content/pages/`. Each file is served at `/<filename>`:

```
src/content/pages/about.md  →  /about
```

Frontmatter:

```yaml
---
title: "About"
---
```

---

## Generators

Create content files without editing them by hand:

```bash
bunx cosmolo generate             # Interactive menu (article / page / category)
bunx cosmolo generate article     # Create an article
bunx cosmolo generate page        # Create a static page
bunx cosmolo generate category    # Add a category to categories.json
```

`cosmolo init` adds convenience scripts to your `package.json` automatically, so after init you can just run:

```bash
bun generate:article
bun generate:page
bun generate:category
```

### Article

Prompts for title, slug, category, excerpt, tags, sort, date, draft status, and series.
Creates `src/content/articles/<slug>.md` with pre-filled frontmatter.

### Page

Prompts for title and slug. Creates `src/content/pages/<slug>.md`.

### Category

Prompts for key (slug), label, and description. Appends the new entry to `config/categories.json`.

---

## Cloudflare

Cosmolo works with any SvelteKit-compatible deployment platform, but it is purpose-built
around the Cloudflare stack. SvelteKit and Cloudflare Workers are an unusually good fit —
edge-native rendering, zero cold starts, globally distributed infrastructure, and a generous
free tier. Cosmolo's CLI removes the usual setup friction so you can go from `init` to
deployed in minutes.

### One-command Cloudflare setup

```bash
bunx cosmolo init   # choose "Cloudflare" when prompted for adapter
```

This single command generates everything needed to deploy:

| Generated file | Purpose |
|---|---|
| `svelte.config.js` | Pre-configured with `adapter-cloudflare` |
| `wrangler.toml` | Project name, `nodejs_compat`, D1 template commented out |
| `src/app.d.ts` | `App.Platform` with `Env`, `CfProperties`, `ExecutionContext` |
| `.github/workflows/deploy.yml` | Optional — push-to-`main` deploy via `wrangler-action` |

After init, two commands to go live:

```bash
bun install && bun add -D @sveltejs/adapter-cloudflare @cloudflare/workers-types
bun run deploy   # bun run build + wrangler pages deploy
```

If you opted in to GitHub Actions during init, pushing to `main` triggers the deploy automatically.

### Cloudflare services

| Command | What it sets up |
|---|---|
| `cosmolo migrate:db` → option 3 | **D1** — Drizzle schema, CRUD helpers (`getArticlesByCategory`, `getArticlesByTag`, …), D1-backed `+page.server.ts` route files |
| `cosmolo setup:r2` | **R2** — `wrangler.toml` binding, `src/lib/r2.ts` helper, `/assets/[...key]` edge serving route |

Each command is self-contained — run only the ones you need.

---

## Database Migration

When a file-based Cosmolo site outgrows Markdown — multiple writers, mobile editing,
a growing team — `migrate:db` converts your content to a database without rewriting
your application code.

DB support is optional. File-based sites continue to work exactly as before.
Migration is a one-time operation when you're ready to scale.

```bash
bunx cosmolo migrate:db
```

The command is interactive and offers three paths:

| Option | Description |
|---|---|
| **1 — Export SQL files** | Generates `cosmolo-migration/*.sql` (CREATE TABLE + INSERT for all articles and categories). Works with any relational database. |
| **2 — Execute directly** | Executes the same SQL against a local SQLite database. Set `DATABASE_URL=./mysite.db` before running. |
| **3 — Drizzle + Cloudflare D1** | Full setup: generates Drizzle schema, CRUD helpers, `wrangler.toml` D1 binding, and `drizzle.config.ts`. Runs preflight checks before writing anything. |

### What gets migrated

- **Articles** — all frontmatter fields plus the raw Markdown body. Subdirectory-organized files (e.g. `articles/2024/post.md`) are handled automatically; the slug becomes `2024/post`.
- **Categories** — from `config/categories.json`
- **Draft articles** — included in the DB with `draft = 1`; the generated `getArticles()` helper filters them out automatically

### Option 3 — Drizzle + Cloudflare D1

After a preflight check (drizzle installed, wrangler.toml, table conflicts), the following files are generated:

```
drizzle/schema.ts                            ← Drizzle schema for articles and categories tables
src/lib/db/articles.ts                       ← getArticles, getArticlesByCategory, getArticlesByTag,
                                               getArticle, parseArticle, createArticle, updateArticle, deleteArticle
src/lib/db/categories.ts                     ← getCategories, getCategory, createCategory, updateCategory, deleteCategory
wrangler.toml                                ← [[d1_databases]] binding added (merged if file exists)
drizzle.config.ts                            ← drizzle-kit config (dialect: sqlite)
.dev.vars.example                            ← Cloudflare environment variable reference
```

Optionally (prompted during setup), the existing `+page.server.ts` route files are replaced with D1-backed versions that read from `platform.env.DB` instead of the Cosmolo virtual module:

```
src/routes/+page.server.ts                   ← Home page — getArticles + getCategories from D1
src/routes/articles/[slug]/+page.server.ts   ← Article — getArticle from D1, Markdown rendered with marked
src/routes/categories/[slug]/+page.server.ts ← Category — getArticlesByCategory from D1
src/routes/tags/[tag]/+page.server.ts        ← Tag — getArticlesByTag from D1 (json_each query)
```

The command prints step-by-step instructions after generation:
1. `bunx wrangler d1 create <db-name>` and copy the `database_id` into `wrangler.toml`
2. `bunx drizzle-kit generate` to create SQL migration files
3. `bunx wrangler d1 migrations apply <db-name> --local` to apply locally
4. Run Option 1 to export seed SQL, then `wrangler d1 execute` to import your articles
5. `bun add -d @cloudflare/workers-types` for TypeScript support
6. Add `interface Platform { env: { DB: D1Database } }` to `src/app.d.ts`

### SSR requirement

DB-backed content requires a server-capable adapter. Content in D1 is resolved at
request time, so `adapter-static` (SSG) is not compatible.

Switch to `adapter-cloudflare` for Cloudflare Pages, or `adapter-node` for a
self-hosted server:

```diff
- import adapter from '@sveltejs/adapter-static';
+ import adapter from '@sveltejs/adapter-cloudflare';
```

The upside: content edits take effect immediately — no rebuild or redeploy needed.

---

## R2 Asset Storage

Add Cloudflare R2 object storage for article images and other binary assets:

```bash
bunx cosmolo setup:r2
```

The command asks for a bucket name and binding name, then generates:

```
src/lib/r2.ts                          ← getR2Asset(bucket, key) helper
src/routes/assets/[...key]/+server.ts  ← Edge route — serves files directly from R2
wrangler.toml                          ← [[r2_buckets]] binding appended
```

After setup:

```bash
# 1. Create the bucket
bunx wrangler r2 bucket create <bucket-name>

# 2. Upload an asset
bunx wrangler r2 object put <bucket-name>/images/photo.jpg --file ./static/images/photo.jpg

# 3. Reference it in templates as /assets/images/photo.jpg
```

Add the binding type to `src/app.d.ts` (one line):

```ts
interface Platform { env: { ASSETS: R2Bucket } }
```

---

## Headless CMS

Cosmolo can expose your content as static JSON endpoints, making it usable as a
headless CMS alongside — or independently of — your rendered pages.

All endpoints are **static files** generated at build time. No server or database is required.

| Endpoint | Description |
|---|---|
| `/api/articles.json` | Slug + title for all non-draft articles |
| `/api/articles/<slug>.json` | Full metadata and body for a single article |
| `/api/categories.json` | All categories with slug, label, and description |
| `/rss.xml` | RSS 2.0 feed |
| `/sitemap.xml` | XML sitemap including all article, category, and tag URLs |

`cosmolo init` scaffolds `rss.xml` and `sitemap.xml` automatically. The JSON API routes
(`api/articles.json`, `api/articles/[slug].json`, `api/categories.json`) can be added
manually or customized to return exactly the fields your consumers need.

### Article body format

The per-article endpoint supports three body formats, configurable in `config/site.json`:

```json
"api": { "articleBody": "html" }
```

| Value | `contentsFormat` | `contents` |
|---|---|---|
| `"html"` | `"html"` | Rendered HTML (default) |
| `"markdown"` | `"markdown"` | Raw Markdown (frontmatter stripped) |
| `"plaintext"` | `"plaintext"` | Plain text — Markdown syntax removed |

> **Note:** All API endpoints are publicly accessible static files. Do not include
> sensitive or private information in article frontmatter or content.

---

## Package Reference

### Install

```bash
bun add cosmolo
# peer deps (if not already installed)
bun add -D vite @sveltejs/kit
```

### Setup

**1. Create `cosmolo.config.ts`** in your project root

```typescript
import { resolveConfig } from 'cosmolo/plugin';

export default resolveConfig({
  articlesDir: 'src/content/articles',    // default
  pagesDir:    'src/content/pages',       // default
  siteConfigPath:       'config/site.json',       // default
  categoriesConfigPath: 'config/categories.json', // default
});
```

All fields are optional. Omitting them uses the defaults shown above.

**2. Register the Vite plugin** in `vite.config.ts`

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { cosmoloPlugin } from 'cosmolo/plugin';
import config from './cosmolo.config';

export default {
  plugins: [sveltekit(), cosmoloPlugin(config)],
};
```

The plugin generates a virtual module (`cosmolo:content`) containing `import.meta.glob`
calls for your configured paths. All content — including `categories.json` and
`site.json` — is bundled at build time with no `fs` access at runtime, making Cosmolo
compatible with Cloudflare Workers and other serverless runtimes.

### Scaffolding with `cosmolo init`

Instead of writing route files by hand, run:

```bash
bunx cosmolo init
```

The command asks two questions:

**Mode**

| Mode | What gets generated |
|---|---|
| **A — Full** | `+page.server.ts` + `+page.svelte` for every route, `sitemap.xml`, `rss.xml`, `Pagination.svelte`, `cosmolo.config.ts`, `vite.config.ts` |
| **B — Slim** | Server routes only — bring your own Svelte UI |

**Adapter**

| Adapter | Generated files |
|---|---|
| **SSG** (`adapter-static`) | `svelte.config.js` (adapter-static) + `src/routes/+layout.ts` (`prerender = true`) |
| **Cloudflare** (`adapter-cloudflare`) | `svelte.config.js` (adapter-cloudflare) + `wrangler.toml` + `src/app.d.ts` (`Platform` type). Optionally `.github/workflows/deploy.yml`. |
| **Serverless** | No extra files — bring your own adapter (Vercel, Node, etc.) |

If any target file already exists, the command lists every conflict and exits without
writing anything.

**Manual prerender setup**

If you chose Serverless but later switch to SSG, add this file:

```typescript
// src/routes/+layout.ts
export const prerender = true;
```

### Load function factories

`+page.server.ts` files can use factory functions instead of writing load boilerplate:

```typescript
// src/routes/+page.server.ts
import { createArticlesLoader } from 'cosmolo';
import config from '../../cosmolo.config';
export const load = createArticlesLoader(config);
```

```typescript
// src/routes/articles/[slug]/+page.server.ts
import { createArticleLoader, createArticleEntries } from 'cosmolo';
import config from '../../../../cosmolo.config';
export const entries = createArticleEntries(config);
export const load = createArticleLoader(config);
```

```typescript
// src/routes/categories/[slug]/+page.server.ts
import { createCategoryLoader, createCategoryEntries } from 'cosmolo';
import config from '../../../../cosmolo.config';
export const entries = createCategoryEntries(config);
export const load = createCategoryLoader(config);
```

```typescript
// src/routes/tags/[tag]/+page.server.ts
import { createTagLoader, createTagEntries } from 'cosmolo';
import config from '../../../../cosmolo.config';
export const entries = createTagEntries(config);
export const load = createTagLoader(config);
```

For git-based updated dates on the article loader:

```typescript
import { execSync } from 'child_process';

export const load = createArticleLoader(config, {
  getUpdatedAt(slug) {
    try {
      return execSync(
        `git log -1 --format=%cI -- "src/content/articles/${slug}.md"`,
        { encoding: 'utf-8' }
      ).trim().split('T')[0];
    } catch { return ''; }
  },
});
```

### Using helpers in Svelte components

Category labels and SVX components are safe to use directly in `.svelte` files:

```svelte
<script lang="ts">
  import { getCategoryLabel, getSvxComponent } from 'cosmolo';
  import config from '../../../../cosmolo.config';
  import type { Component } from 'svelte';

  const { data } = $props();

  // Category label (works client-side — no fs at runtime)
  const label = getCategoryLabel(config, data.article.category);

  // SVX component for .svx articles (undefined for .md)
  const SvxComponent = getSvxComponent(config, data.article.slug) as Component | undefined;
</script>
```

### Package exports

| Import | Description |
|---|---|
| `cosmolo` | Types, config resolver, all content functions |
| `cosmolo/plugin` | `cosmoloPlugin(config)` — Vite plugin |

Key exports from `cosmolo`:

| Export | Description |
|---|---|
| `resolveConfig(config?)` | Merge user config with defaults |
| `getArticles(config)` | All non-draft articles, sorted |
| `getArticle(config, slug)` | Single article with rendered HTML + TOC |
| `getArticlesByTag(config, tag)` | Articles filtered by tag |
| `getArticlesBySeries(config, series)` | Articles in a series, sorted by `seriesOrder` |
| `getSlugs(config)` | All non-draft article slugs |
| `getTags(config)` | All tags across all articles |
| `getSvxComponent(config, slug)` | Svelte component for an `.svx` article (client-safe) |
| `getCategoryLabel(config, key)` | Category label by key (client-safe) |
| `getAllCategories(config)` | All category entries |
| `loadSiteConfig(config)` | Site configuration object |
| `getPage(config, slug)` | Single static page with rendered HTML |
| `getPageSlugs(config)` | All static page slugs |
| `createArticlesLoader(config)` | Load factory for article listings |
| `createArticleLoader(config, opts?)` | Load factory for single article |
| `createCategoryLoader(config)` | Load factory for category pages |
| `createTagLoader(config)` | Load factory for tag pages |
| `createPageLoader(config)` | Load factory for static pages |
| `createArticleEntries(config)` | `entries()` generator for article routes |
| `createCategoryEntries(config)` | `entries()` generator for category routes |
| `createTagEntries(config)` | `entries()` generator for tag routes |
| `createPageEntries(config)` | `entries()` generator for page routes |

---

## Deployment

### SSG vs Serverless

All content loading happens at build time via `import.meta.glob` and the Vite plugin,
so there are no `fs` calls at runtime. Cosmolo works with any SvelteKit adapter.

| Adapter | Notes |
|---|---|
| `@sveltejs/adapter-static` | Full SSG — `cosmolo init` sets `prerender = true` automatically for SSG mode |
| `@sveltejs/adapter-cloudflare` | Cloudflare Workers / Pages (SSR). No extra config needed. |
| `@sveltejs/adapter-vercel` | Vercel Edge / Node. No extra config needed. |
| `@sveltejs/adapter-node` | Self-hosted Node server. No extra config needed. |

### Cloudflare Pages (SSG)

Cloudflare Pages offers a free tier with global CDN, automatic HTTPS, and Git-based
deployments.

**1. Push your repo to GitHub.**

**2. Create a new Pages project**

1. Open the [Cloudflare dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages**
2. Click **Create** → **Pages** → **Connect to Git**
3. Authorize Cloudflare and select your repository

**3. Configure the build settings**

| Setting | Value |
|---------|-------|
| Framework preset | None |
| Build command | `npx bun run build` |
| Build output directory | `build` |

> Cloudflare Pages uses Node.js by default. Using `npx bun run build` ensures bun is
> available without requiring a custom environment. Alternatively, add `BUN_VERSION=latest`
> as an environment variable to enable native bun support.

**4. Deploy**

Click **Save and Deploy**. Cloudflare pulls your code, runs the build, and publishes
the `build/` directory to their global edge network.

**Custom domain**

Go to your Pages project → **Custom domains** → add your domain. If your domain's DNS
is managed on Cloudflare, the setup is automatic.

### Vercel

```bash
bunx vercel --prod
```

Or connect via the Vercel dashboard. Build command: `bun run build`. Output directory: `build`.

### Netlify

```bash
bunx netlify deploy --prod --dir build
```

Or connect via the Netlify dashboard. Build command: `bun run build`. Publish directory: `build`.

---

## Development Commands

```bash
bun dev       # Start dev server at http://localhost:5173
bun build     # Build output
bun preview   # Preview the production build
bun check     # TypeScript type-check
bun lint      # Run Prettier + ESLint checks
bun format    # Auto-format all files
```

---

## License

MIT
