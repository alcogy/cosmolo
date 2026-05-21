---
title: "Hello, Cosmolo"
category: "tech"
excerpt: "A quick tour of what Cosmolo can do out of the box."
sort: 100
date: "2025-01-01"
---

## Welcome

This is your first article. Place `.md` files in `src/content/articles/` and they appear here automatically.

## Frontmatter

Every article requires five fields:

| Field      | Purpose                                        |
|------------|------------------------------------------------|
| `title`    | Shown in listings and the article header       |
| `category` | Must match a key in `config/categories.json`   |
| `excerpt`  | One-sentence summary shown in listings         |
| `sort`     | Higher number = appears earlier in the list    |
| `date`     | ISO date string, shown next to the category    |

## Markdown features

Standard Markdown works out of the box — headings, **bold**, _italic_, `inline code`,
[links](https://svelte.dev), lists, tables, and blockquotes.

> Blockquotes look like this.

### YouTube embed

Use the `::youtube[id]` shorthand to embed a video:

::youtube[dQw4w9WgXcQ]

### External links

Links to external sites automatically get `target="_blank" rel="noopener noreferrer"` —
no configuration needed.

## What's next

- Add more articles to `src/content/articles/`
- Define your categories in `config/categories.json`
- Update your site name and URL in `config/site.json`
- For interactive content, try a `.svx` file
