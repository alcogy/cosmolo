<script lang="ts">
	import { siteConfig } from '$lib/config';
	import CategoryNav from '$lib/components/CategoryNav.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.label} — {siteConfig.name}</title>
	<meta name="description" content={data.description || `Articles in the ${data.label} category.`} />
	<meta property="og:title" content="{data.label} — {siteConfig.name}" />
</svelte:head>

<section class="category-page">
	<div class="container">
		<header class="category-page__header">
			<h1 class="category-page__title">{data.label}</h1>
			{#if data.description}
				<p class="category-page__description">{data.description}</p>
			{/if}
		</header>

		<div class="category-page__nav">
			<CategoryNav currentSlug={data.slug} />
		</div>

		{#if data.articles.length === 0}
			<p class="category-page__empty">No articles in this category yet.</p>
		{:else}
			<ul class="article-list">
				{#each data.articles as article}
					<li class="article-card">
						<a href="/articles/{article.slug}" class="article-card__link">
							<div class="article-card__meta">
								{#if article.date}
									<time class="article-card__date" datetime={article.date}>{article.date}</time>
								{/if}
							</div>
							<h2 class="article-card__title">{article.title}</h2>
							<p class="article-card__excerpt">{article.excerpt}</p>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style lang="scss">
	.category-page {
		padding: var(--spacing-2xl) 0;

		&__header {
			margin-bottom: var(--spacing-xl);
		}

		&__title {
			font-size: 1.75rem;
			font-weight: 700;
			margin-bottom: var(--spacing-sm);
		}

		&__description {
			color: var(--color-text-secondary);
			font-size: 1rem;
		}

		&__nav {
			margin-bottom: var(--spacing-xl);
		}

		&__empty {
			color: var(--color-text-secondary);
		}
	}

	.article-list {
		list-style: none;
		display: grid;
		gap: var(--spacing-lg);
	}

	.article-card {
		&__link {
			display: block;
			padding: var(--spacing-lg);
			border: 1px solid var(--color-border);
			border-radius: var(--border-radius);
			text-decoration: none;
			color: inherit;
			transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

			&:hover {
				border-color: var(--color-accent);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
			}
		}

		&__meta {
			margin-bottom: var(--spacing-sm);
		}

		&__date {
			font-size: 0.8125rem;
			color: var(--color-text-secondary);
		}

		&__title {
			font-size: 1.125rem;
			font-weight: 600;
			margin-bottom: var(--spacing-xs);
			color: var(--color-text-primary);
		}

		&__excerpt {
			font-size: 0.9375rem;
			color: var(--color-text-secondary);
			line-height: 1.5;
		}
	}
</style>
