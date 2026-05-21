# Cosmolo

A SvelteKit-native Markdown CMS starter — clone it, configure it, own it.

Cosmolo gives you a production-ready content site scaffold built on SvelteKit,
MDSveX, Zod-validated frontmatter, and a config-driven category system.
No framework lock-in beyond SvelteKit.

---

## Quick Start

```bash
# 1. Use this repo as a GitHub template (click "Use this template") or clone it
git clone https://github.com/your-org/cosmolo.git my-site
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

| Field                  | Description                                       |
|------------------------|---------------------------------------------------|
| `url`                  | Your production URL (used in sitemap and OGP)     |
| `name`                 | Site name shown in header and `<title>`           |
| `description`          | Default meta description                          |
| `twitterHandle`        | Twitter/X handle for `twitter:site` meta tag      |
| `fallbackCategoryLabel`| Label shown for the `other` fallback category     |

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

## Article Frontmatter

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

### Supported file formats

| Extension | Renderer        | Svelte components |
|-----------|-----------------|-------------------|
| `.md`     | `marked`        | No                |
| `.svx`    | MDSveX          | Yes               |

Place files in `src/content/articles/`. The filename becomes the slug:
`src/content/articles/my-post.md` → `/articles/my-post`.

### Markdown extensions

**YouTube embed** — renders a responsive 16:9 iframe:

```
::youtube[dQw4w9WgXcQ]
```

**External links** — all `http://` and `https://` links automatically get
`target="_blank" rel="noopener noreferrer"`.

### Svelte components in `.svx`

```svx
<script>
  import Callout from '$lib/components/Callout.svelte';
</script>

<Callout type="warning">Watch out for this edge case.</Callout>
```

Callout types: `info` (default) · `tip` · `warning` · `danger`

---

## Static Pages

Place `.md` files in `src/content/pages/`. Each file is served at `/<filename>`:

```
src/content/pages/about.md → /about
```

Frontmatter:

```yaml
---
title: "About"
---
```

---

## Static Assets

Replace the placeholder assets in `static/` before deploying:

| File                | Purpose                        |
|---------------------|--------------------------------|
| `static/favicon.png`| Browser tab icon               |
| `static/og-image.png`| Default Open Graph image (1200×630) |
| `static/robots.txt` | Already included               |

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

1. Connect your GitHub repo in the Cloudflare Pages dashboard
2. Set build command: `bun run build`
3. Set output directory: `build`

### Vercel

```bash
bunx vercel --prod
```

Or connect via the Vercel dashboard. Build command: `bun run build`.
Output directory: `build`.

### Netlify

```bash
bunx netlify deploy --prod --dir build
```

Or connect via the Netlify dashboard. Build command: `bun run build`.
Publish directory: `build`.

### Apache / Nginx (self-hosted)

Upload the contents of `build/` to your web root.

For Apache, add a `.htaccess` if you need URL rewriting (Cosmolo generates
clean static HTML, so no rewrite rules are required for basic use).

---

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for detailed design decisions.

See [`docs/CONCEPT.md`](docs/CONCEPT.md) for project philosophy and positioning.

---

## Roadmap

See [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## License

MIT
