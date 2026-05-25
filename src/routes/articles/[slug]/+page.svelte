<script lang="ts">
	import { siteConfig } from '$lib/config';
	import { getCategoryLabel } from '$lib/categories';
	import CategoryNav from '$lib/components/CategoryNav.svelte';
	import type { PageData } from './$types';
	import type { Component } from 'svelte';

	const { data }: { data: PageData } = $props();

	// Eagerly import all .svx modules so we can pick the right component by slug
	const svxModules = import.meta.glob('/src/content/articles/*.svx', {
		eager: true
	}) as Record<string, { default: Component }>;

	const SvxComponent = $derived(
		svxModules[`/src/content/articles/${data.article.slug}.svx`]?.default
	);

	const ogImage = $derived(
		siteConfig.ogImage.mode === 'generated'
			? `${siteConfig.url}/og/${data.article.slug}.png`
			: `${siteConfig.url}/og-image.png`
	);
</script>

<svelte:head>
	<title>{data.article.title} — {siteConfig.name}</title>
	<meta name="description" content={data.article.excerpt} />
	<meta property="og:title" content={data.article.title} />
	<meta property="og:description" content={data.article.excerpt} />
	<meta property="og:type" content="article" />
	<meta property="og:image" content={ogImage} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

<article class="article">
	<div class="container">
		<header class="article__header">
			<div class="article__meta">
				<a href="/categories/{data.article.category}" class="article__category">
					{getCategoryLabel(data.article.category)}
				</a>
				{#if data.article.date}
					<time class="article__date" datetime={data.article.date}>{data.article.date}</time>
				{/if}
				{#if data.updatedAt && data.updatedAt !== data.article.date}
					<span class="article__updated">Updated: <time datetime={data.updatedAt}>{data.updatedAt}</time></span>
				{/if}
			</div>
			<h1 class="article__title">{data.article.title}</h1>
			<p class="article__excerpt">{data.article.excerpt}</p>
		</header>

		<div class="article__body prose">
			{#if SvxComponent}
				<SvxComponent />
			{:else}
				{@html data.article.html}
			{/if}
		</div>

		<footer class="article__footer">
			<a href="/" class="article__back">&#8592; Back to articles</a>

			{#if data.related.length > 0}
				<section class="related">
					<h2 class="related__heading">More in this category</h2>
					<ul class="related__list">
						{#each data.related as rel}
							<li>
								<a href="/articles/{rel.slug}" class="related__link">
									<span class="related__title">{rel.title}</span>
									<span class="related__excerpt">{rel.excerpt}</span>
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<section class="category-browse">
				<h2 class="category-browse__heading">Browse categories</h2>
				<CategoryNav />
			</section>
		</footer>
	</div>
</article>

<style lang="scss">
	.article {
		padding: var(--spacing-2xl) 0;

		&__header {
			margin-bottom: var(--spacing-2xl);
			padding-bottom: var(--spacing-xl);
			border-bottom: 1px solid var(--color-border);
		}

		&__meta {
			display: flex;
			align-items: center;
			gap: var(--spacing-md);
			margin-bottom: var(--spacing-md);
		}

		&__category {
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--color-accent);
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}

		&__date {
			font-size: 0.8125rem;
			color: var(--color-text-secondary);
		}

		&__updated {
			font-size: 0.8125rem;
			color: var(--color-text-secondary);
		}

		&__title {
			font-size: 2rem;
			font-weight: 700;
			line-height: 1.25;
			margin-bottom: var(--spacing-md);
		}

		&__excerpt {
			font-size: 1.0625rem;
			color: var(--color-text-secondary);
			line-height: 1.6;
		}

		&__body {
			margin-bottom: var(--spacing-2xl);
		}

		&__footer {
			border-top: 1px solid var(--color-border);
			padding-top: var(--spacing-xl);
		}

		&__back {
			display: inline-block;
			color: var(--color-text-secondary);
			font-size: 0.9375rem;
			text-decoration: none;
			margin-bottom: var(--spacing-2xl);

			&:hover {
				color: var(--color-text-primary);
			}
		}
	}

	.related {
		margin-bottom: var(--spacing-2xl);

		&__heading {
			font-size: 1rem;
			font-weight: 600;
			margin-bottom: var(--spacing-md);
			color: var(--color-text-secondary);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			font-size: 0.75rem;
		}

		&__list {
			list-style: none;
			display: grid;
			gap: var(--spacing-sm);
		}

		&__link {
			display: block;
			padding: var(--spacing-md);
			border: 1px solid var(--color-border);
			border-radius: var(--border-radius);
			text-decoration: none;
			color: inherit;
			transition: border-color var(--transition-fast);

			&:hover {
				border-color: var(--color-accent);
			}
		}

		&__title {
			display: block;
			font-weight: 500;
			margin-bottom: var(--spacing-xs);
			color: var(--color-text-primary);
		}

		&__excerpt {
			display: block;
			font-size: 0.875rem;
			color: var(--color-text-secondary);
		}
	}

	.category-browse {
		&__heading {
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--color-text-secondary);
			margin-bottom: var(--spacing-md);
		}
	}

</style>
