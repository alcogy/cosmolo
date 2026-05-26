---
title: "Hello, Cosmolo"
category: "tech"
excerpt: "A quick tour of what Cosmolo can do out of the box."
sort: 100
date: "2025-01-01"
tags: ["svelte", "tutorial"]
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

Use the shorthand to embed a video like this:
```
::youtube[dQw4w9WgXcQ]
```

::youtube[dQw4w9WgXcQ]


### Images

Place image files in `static/images/` and reference them with a root-relative path:

```md
![Alt text](/images/sample.jpg)
```

![Sample image](/images/sample.jpg)

### External links

Links to external sites automatically get `target="_blank" rel="noopener noreferrer"` —
no configuration needed.

## What's next

- Add more articles to `src/content/articles/`
- Define your categories in `config/categories.json`
- Update your site name and URL in `config/site.json`
- For interactive content, try a `.svx` file
