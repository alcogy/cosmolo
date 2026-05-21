<script lang="ts">
	import { siteConfig } from '$lib/config';
	import { getCategoryLabel } from '$lib/categories';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{siteConfig.name}</title>
	<meta property="og:title" content={siteConfig.name} />
	<meta property="og:description" content={siteConfig.description} />
</svelte:head>

<section class="home">
	<div class="container">
		<h1 class="home__heading">Articles</h1>

		{#if data.articles.length === 0}
			<p class="home__empty">No articles yet. Add your first article to <code>src/content/articles/</code>.</p>
		{:else}
			<ul class="article-list">
				{#each data.articles as article}
					<li class="article-card">
						<a href="/articles/{article.slug}" class="article-card__link">
							<div class="article-card__meta">
								<span class="article-card__category">
									{getCategoryLabel(article.category)}
								</span>
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
	.home {
		padding: var(--spacing-2xl) 0;

		&__heading {
			font-size: 1.75rem;
			font-weight: 700;
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
			display: flex;
			align-items: center;
			gap: var(--spacing-md);
			margin-bottom: var(--spacing-sm);
		}

		&__category {
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--color-accent);
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
