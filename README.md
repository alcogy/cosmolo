# Cosmolo

A SvelteKit-native Markdown CMS starter — clone it, configure it, own it.

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
category: "tech"          # must match a key in config/categories.json
excerpt: "One sentence shown in article listings."
sort: 100                 # higher number = appears earlier in listings
date: "2025-01-15"        # ISO date string (optional)
---
```

`sort` gives you manual ordering without relying on file timestamps or alphabetical order.
Articles with an unknown `category` value are grouped under `/categories/other`.

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
    +page.svelte       ← Home: article card grid
    articles/[slug]/   ← Article page (.md → {@html} / .svx → <svelte:component>)
    categories/[slug]/ ← Category listing (includes 'other' fallback)
    (pages)/[slug]/    ← Generic static page template
    sitemap.xml/       ← Auto-generated sitemap
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
