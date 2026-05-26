# Cosmolo

A SvelteKit-native Markdown CMS starter — clone it, configure it, own it.

**Website:** https://cosmolo.alcogy.dev

Cosmolo gives you a production-ready content site scaffold built on SvelteKit,
MDSveX, Zod-validated frontmatter, and a config-driven category system.
No framework lock-in beyond SvelteKit.

> **Name origin**: Short for *cosmologist* — a deliberate nod to Astro. Cosmolo occupies
> a similar content-site niche but stays entirely within the SvelteKit ecosystem.

---

## Why Cosmolo

Developers who love SvelteKit often reach for Astro when building blogs or docs sites —
not because they prefer Astro, but because SvelteKit lacks a canonical "just add Markdown
and go" story. Cosmolo is that story.

| | Cosmolo | Astro | Nuxt Content | SvelteKit (vanilla) |
|---|---|---|---|---|
| Framework | SvelteKit | Astro | Nuxt (Vue) | SvelteKit |
| Markdown | MDSveX + marked | Built-in | Built-in | Manual |
| Type-safe frontmatter | Zod | TS inference | Zod (optional) | Manual |
| Component in Markdown | Yes (.svx) | Yes (.mdx) | Yes | No |
| Config-driven categories | Yes | No | No | No |
| Learning curve | SvelteKit only | Astro concepts | Vue + Nuxt | SvelteKit only |

**Core principles:**

1. **SvelteKit all the way down** — No adapters, no bridges. Developers who know SvelteKit already know Cosmolo.
2. **Config over convention** — Site identity and taxonomy are JSON files. No source code changes needed to add a category.
3. **Type-safe content** — Frontmatter is validated with Zod at build time. Malformed articles fail loudly during `bun build`.
4. **MDSveX as a first-class citizen** — `.md` and `.svx` share the same routing and Zod schema; the system auto-detects which to use.
5. **Own your code** — Cosmolo is a template, not a dependency. Once you clone it, you own every line.

---

## Quick Start

```bash
# 1. Use this repo as a GitHub template (click "Use this template") or clone it
git clone https://github.com/alcogy/cosmolo my-site
cd my-site

# 2. Install dependencies
bun install

# 3. Configure your site
#    Edit config/site.json and config/categories.json

# 4. Add your first article
#    Create src/content/articles/my-first-post.md

# 5. Start the dev server
bun dev
```

Open `http://localhost:5173` to see your site.

---

## Configuration

### `config/site.json`

Site-wide settings. Edit before deploying.

| Field                   | Description                                   |
|-------------------------|-----------------------------------------------|
| `url`                   | Production URL (used in sitemap and OGP)      |
| `name`                  | Site name shown in header and `<title>`       |
| `description`           | Default meta description                      |
| `twitterHandle`         | Twitter/X handle for `twitter:site` meta tag  |
| `fallbackCategoryLabel` | Label shown for the `other` fallback category |

```json
{
  "url": "https://your-site.example.com",
  "name": "Your Site Name",
  "description": "A content site built with Cosmolo.",
  "twitterHandle": "@yourhandle",
  "fallbackCategoryLabel": "Other"
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
has never been committed (e.g. a new draft that is not yet tracked by git), the updated
date is omitted silently.

> **Note:** file modification times (`mtime`) are intentionally not used. They reset on
> `git clone`, which makes them unreliable in CI/CD environments.

### Draft mode

Add `draft: true` to any article's frontmatter to exclude it from build output and all listings.
Draft articles are invisible in production but accessible during `bun dev` via their direct URL,
so you can preview them before publishing.

```yaml
---
title: "Work in Progress"
draft: true
---
```

### Tags

Articles can have multiple tags. Each tag gets a listing page at `/tags/<tag>`.

```yaml
tags: ["svelte", "tutorial"]
```

Tag links appear as chips in the article header. Tags are case-sensitive (`Svelte` and `svelte`
are treated as different tags). Unused tags (no articles) produce no page.

### Series

Group related articles into an ordered sequence. Prev/next navigation is shown inside each article.

```yaml
series: "getting-started"
seriesOrder: 1
```

All articles sharing the same `series` value are linked together, sorted by `seriesOrder` ascending.
`seriesOrder` is 1-based by convention, but any integers work.

### Manual related articles

By default, the "More in this category" panel shows up to 4 articles from the same category.
Override it by listing slugs explicitly — the specified articles replace the auto-detected ones entirely.

```yaml
related: ["slug-a", "slug-b"]
```

### Table of contents

For `.md` articles with 2 or more `##` headings, a table of contents is automatically rendered
above the article body. Heading levels `##` through `######` are included; indentation reflects
the nesting depth. `.svx` articles do not get an auto-generated TOC.

### Supported file formats

| Extension | Renderer | Svelte components in body |
|-----------|----------|---------------------------|
| `.md`     | `marked` | No                        |
| `.svx`    | MDSveX   | Yes                       |

Place files in `src/content/articles/`. The filename becomes the URL slug:

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

Callout types: `info` (default) · `tip` · `warning` · `danger`

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

## Content APIs

Cosmolo generates static JSON and RSS endpoints alongside your HTML pages.
All outputs are static files — no server required.

| Endpoint | Content-Type | Description |
|---|---|---|
| `/api/articles.json` | `application/json` | Slug + title for all non-draft articles |
| `/api/articles/<slug>.json` | `application/json` | Full content and metadata for one article |
| `/api/categories.json` | `application/json` | All categories as structured JSON |
| `/rss.xml` | `application/rss+xml` | RSS 2.0 feed for feed readers |

### `/api/articles.json`

Index endpoint — slug and title only. Lightweight enough for any article count.
Add fields as needed by editing `src/routes/api/articles.json/+server.ts`.

```json
{
  "articles": [
    { "slug": "hello-world", "title": "Hello, Cosmolo" }
  ]
}
```

### `/api/articles/<slug>.json`

Per-article endpoint — full metadata plus the article body in the configured format.

The body format is set in `config/site.json` under `api.articleBody` and applies at build time:

```json
"api": {
  "articleBody": "html"
}
```

| Value | `contentsFormat` | `contents` |
|---|---|---|
| `"html"` | `"html"` | Rendered HTML (default) |
| `"markdown"` | `"markdown"` | Raw Markdown body (frontmatter stripped) |
| `"plaintext"` | `"plaintext"` | Plain text — Markdown syntax stripped |

The response always uses `contents` as the field name. `contentsFormat` tells you which format was used:

```json
{
  "slug": "hello-world",
  "title": "Hello, Cosmolo",
  "excerpt": "A quick tour of what Cosmolo can do out of the box.",
  "category": "tech",
  "categoryLabel": "Technology",
  "tags": ["svelte", "tutorial"],
  "series": null,
  "seriesOrder": null,
  "date": "2025-01-01",
  "sort": 100,
  "related": [],
  "contentsFormat": "html",
  "contents": "<h2 id=\"welcome\">Welcome</h2>...",
  "url": "https://your-site.example.com/articles/hello-world"
}
```

> For `.svx` articles all body fields are empty strings — those are Svelte components
> compiled at build time and cannot be serialized as HTML or Markdown.

> **Note:** All API endpoints are static files served publicly. Do not include sensitive
> or private information in article frontmatter or content if you enable these endpoints.

### `/rss.xml`

Standard RSS 2.0. Point feed readers at `<your-site>/rss.xml`.

To add RSS autodiscovery to your layout, add this inside `<svelte:head>` in `src/routes/+layout.svelte`:

```html
<link rel="alternate" type="application/rss+xml" title="Your Site Name" href="/rss.xml" />
```

---

## OGP Images

Cosmolo supports two OGP image modes, controlled by `ogImage.mode` in `config/site.json`.

### `"static"` (default)

All pages share a single `/og-image.png`. Place your image at `static/og-image.png`
(1200×630px recommended) and you're done. No build-time overhead.

```json
"ogImage": { "mode": "static" }
```

### `"generated"`

A unique 1200×630 PNG is generated for each article at build time using
[Satori](https://github.com/vercel/satori). The images are output to `build/og/[slug].png`
and referenced automatically in each article's `og:image` meta tag.

```json
"ogImage": { "mode": "generated" }
```

The card design shows the article title, category, and site name. To customize the layout,
edit `src/lib/og.ts`.

**Previewing locally:**

```bash
bun dev
# then open: http://localhost:5173/og/your-article-slug.png
```

---

## Static Assets

Replace the placeholder assets in `static/` before deploying:

| File                  | Purpose                                         |
|-----------------------|-------------------------------------------------|
| `static/favicon.svg`  | Browser tab icon (included)                     |
| `static/og-image.png` | Default OGP image used when mode is `"static"`  |
| `static/robots.txt`   | Already included                                |

---

## Architecture

### Directory structure

```
packages/
  cosmolo/             ← npm package (bun add cosmolo)
    src/
      plugin.ts        ← Vite plugin (virtual module generator)
      articles.ts      ← Article parsing and listing
      categories.ts    ← Category helpers
      pages.ts         ← Static page parsing
      markdown.ts      ← marked configuration
      loaders.ts       ← SvelteKit load function factories
      types.ts         ← Shared TypeScript types
      config.ts        ← Config resolver with defaults
      index.ts         ← Package entry point
config/
  site.json            ← Site-wide settings (URL, name, social)
  categories.json      ← Category registry (key → label + description)
src/
  app.html             ← HTML shell
  app.scss             ← Global styles (CSS custom properties, resets)
  content/
    articles/          ← Article files (.md or .svx)
    pages/             ← Static pages (.md, e.g. about.md)
  lib/
    config.ts          ← Typed re-export of config/site.json
    categories.ts      ← Category lookup helpers
    articles.ts        ← Zod schema, article parsing and listing
    markdown.ts        ← marked configuration (YouTube embed, external links)
    og.ts              ← OGP image generation (Satori + resvg-js)
    pages.ts           ← Static page parsing
    components/
      Callout.svelte   ← Styled callout box for .svx articles
      CategoryNav.svelte ← Category navigation links
  routes/
    +layout.ts         ← prerender = true (global SSG)
    +layout.svelte     ← Header, footer, global meta tags
    +page.server.ts    ← Home: loads article list
    +page.svelte       ← Home: article card grid with search + pagination
    articles/[slug]/   ← Article page (.md → {@html} / .svx → <svelte:component>)
    categories/[slug]/ ← Category listing (includes 'other' fallback)
    tags/[tag]/        ← Tag listing page
    (pages)/[slug]/    ← Generic static page template
    api/articles.json/ ← Static JSON feed of all articles
    api/categories.json/ ← Static JSON feed of all categories
    rss.xml/           ← RSS 2.0 feed
    sitemap.xml/       ← Auto-generated sitemap (includes tag URLs)
    og/[slug].png/     ← Per-article OGP PNG (generated mode only)
static/                ← Static assets (favicon, OG image, robots.txt)
```

### Content pipeline

**`.md` pipeline**: `gray-matter` parses frontmatter → Zod validates → `marked` renders HTML → `{@html ...}` in template.

**`.svx` pipeline**: MDSveX compiles at build time (Svelte component with `metadata` export) → Zod validates `metadata` → `<svelte:component this={Component} />` in template.

Both pipelines share the same Zod frontmatter schema and appear transparently in article listings.

### Fallback category (`other`)

`/categories/other` aggregates articles whose `category` value doesn't match any key in
`categories.json`. This prevents 404s when a category is removed or a frontmatter typo occurs.

### Static generation

`@sveltejs/adapter-static` prerenders every route. `getSlugs()` and `getCategorySlugs()`
drive the `entries()` functions for dynamic routes, so every article and category page is
generated at `bun build` time.

---

## Generators

Cosmolo ships with an interactive CLI to scaffold content without touching files manually.

```bash
bun run generate            # Interactive menu (article / page / category)
bun run generate:article    # Jump straight to article creation
bun run generate:page       # Jump straight to page creation
bun run generate:category   # Jump straight to category creation
```

### Article

Prompts for title, slug, category, excerpt, tags, sort, date, draft status, and series.
Creates `src/content/articles/<slug>.md` with pre-filled frontmatter.

### Page

Prompts for title and slug. Creates `src/content/pages/<slug>.md`.

### Category

Prompts for key (slug), label, and description. Appends the new entry to `config/categories.json`.

---

## New Project

To scaffold a new Cosmolo project from scratch:

```bash
bun scripts/create-cosmolo.ts [directory]
```

Prompts for site name, URL, Twitter handle, and starter categories, then clones the Cosmolo
template, updates the config files, and runs `bun install`.

---

## Package (`bun add cosmolo`)

In addition to the template, Cosmolo is available as an npm package for adding content
management to an **existing SvelteKit project** without cloning the template.

> **Status**: The package lives in `packages/cosmolo/` and is not yet published to npm.
> The API is stable; publishing is pending reception evaluation.

### Scaffolding with `cosmolo init`

The fastest way to get started is the interactive init command, which copies all route
files into your project:

```bash
bunx cosmolo init
# or: npx cosmolo init
```

The command asks two questions:

**1. Mode**

| Mode | What gets generated |
|---|---|
| **A — Full** | `+page.server.ts` + `+page.svelte` for every route, plus `Pagination.svelte` |
| **B — Slim** | `+page.server.ts` only — bring your own Svelte UI |

**2. Adapter**

| Adapter | Effect |
|---|---|
| **SSG** (`adapter-static`) | Also creates `src/routes/+layout.ts` with `export const prerender = true` |
| **Serverless / SSR** | No layout file — routes are rendered on demand (Cloudflare Workers, Vercel, Node…) |

If any target file already exists, the command lists every conflict and exits without
writing anything. You can then remove or rename the conflicting files and re-run.

**Manual prerender setup**

If you chose Serverless during init but later switch to SSG, add this file:

```typescript
// src/routes/+layout.ts
export const prerender = true;
```

Or, if you already have a `+layout.ts`, just add `export const prerender = true;` to it.

---

### Setup

**1. Install**

```bash
bun add cosmolo
# peer deps (if not already installed)
bun add -D vite @sveltejs/kit
```

**2. Create `cosmolo.config.ts`** in your project root

```typescript
import { resolveConfig } from 'cosmolo';

export default resolveConfig({
  articlesDir: 'src/content/articles',   // default — change if needed
  pagesDir:    'src/content/pages',
  siteConfigPath:      'config/site.json',
  categoriesConfigPath: 'config/categories.json',
});
```

All fields are optional. Omitting them uses the defaults shown above.

**3. Register the Vite plugin** in `vite.config.ts`

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { cosmoloPlugin } from 'cosmolo/plugin';
import config from './cosmolo.config';

export default {
  plugins: [sveltekit(), cosmoloPlugin(config)],
};
```

The plugin generates a virtual module (`cosmolo:content`) that contains
`import.meta.glob` calls for your configured paths. This is what makes
the content directory configurable at build time.

### Using load function factories

Replace the boilerplate in each route's `+page.server.ts` with a factory call:

```typescript
// src/routes/+page.server.ts  (article listing)
import { createArticlesLoader } from 'cosmolo';
import config from '../cosmolo.config';
export const load = createArticlesLoader(config);
```

```typescript
// src/routes/articles/[slug]/+page.server.ts
import { createArticleLoader, createArticleEntries } from 'cosmolo';
import config from '../../cosmolo.config';
export const entries = createArticleEntries(config);
export const load = createArticleLoader(config);
```

```typescript
// src/routes/categories/[slug]/+page.server.ts
import { createCategoryLoader, createCategoryEntries } from 'cosmolo';
import config from '../../cosmolo.config';
export const entries = createCategoryEntries(config);
export const load = createCategoryLoader(config);
```

```typescript
// src/routes/tags/[tag]/+page.server.ts
import { createTagLoader, createTagEntries } from 'cosmolo';
import config from '../../cosmolo.config';
export const entries = createTagEntries(config);
export const load = createTagLoader(config);
```

For the article loader, you can pass a `getUpdatedAt` option to wire up
git-based updated dates:

```typescript
import { execSync } from 'child_process';

export const load = createArticleLoader(config, {
  getUpdatedAt(slug) {
    try {
      return execSync(`git log -1 --format=%cI -- "src/content/articles/${slug}.md"`, {
        encoding: 'utf-8',
      }).trim().split('T')[0];
    } catch { return ''; }
  },
});
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
| `getArticles(config)` | All non-draft articles |
| `getArticle(config, slug)` | Single article with HTML + TOC |
| `getArticlesByTag(config, tag)` | Articles filtered by tag |
| `getArticlesBySeries(config, series)` | Articles in a series |
| `getSvxComponent(config, slug)` | Returns the Svelte component for an `.svx` article (safe in Svelte components) |
| `getCategoryLabel(config, key)` | Category label by key — works in Svelte components (no `fs` at runtime) |
| `getAllCategories(config)` | All category entries |
| `loadSiteConfig(config)` | Site configuration object |
| `createArticlesLoader(config)` | Load factory for article listings |
| `createArticleLoader(config, opts?)` | Load factory for single article |
| `createCategoryLoader(config)` | Load factory for category pages |
| `createTagLoader(config)` | Load factory for tag pages |
| `createPageLoader(config)` | Load factory for static pages |

---

## Development Commands

```bash
bun dev       # Start dev server at http://localhost:5173
bun build     # Build static output to build/
bun preview   # Preview the production build
bun check     # TypeScript type-check
bun lint      # Run Prettier + ESLint checks
bun format    # Auto-format all files
```

---

## Deployment

Cosmolo uses `@sveltejs/adapter-static` and outputs to `build/`. Deploy the
`build/` directory to any static host.

### Cloudflare Pages

Cloudflare Pages offers a free tier with global CDN, automatic HTTPS, and Git-based
deployments. It is the recommended hosting option for Cosmolo.

**1. Push your repo to GitHub** (if you haven't already).

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
the `build/` directory to their global edge network. Subsequent pushes to the default
branch trigger automatic redeployments.

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

### Apache / Nginx (self-hosted)

Upload the contents of `build/` to your web root. Cosmolo generates clean static HTML,
so no URL rewriting rules are required for basic use.

---

## License

MIT
