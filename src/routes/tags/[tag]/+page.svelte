<script lang="ts">
	import { siteConfig } from '$lib/config';
	import { getCategoryLabel } from '$lib/categories';
	import Pagination from '$lib/components/Pagination.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	const perPage = siteConfig.articlesPerPage;
	let currentPage = $state(1);

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		data.tag;
		currentPage = 1;
	});

	const paginated = $derived(
		data.articles.slice((currentPage - 1) * perPage, currentPage * perPage)
	);
</script>

<svelte:head>
	<title>#{data.tag} — {siteConfig.name}</title>
	<meta name="description" content="Articles tagged with #{data.tag}." />
	<meta property="og:title" content="#{data.tag} — {siteConfig.name}" />
</svelte:head>

<section class="tag-page">
	<div class="container">
		<header class="tag-page__header">
			<p class="tag-page__label">Tag</p>
			<h1 class="tag-page__title">#{data.tag}</h1>
			<p class="tag-page__count">{data.articles.length} article{data.articles.length !== 1 ? 's' : ''}</p>
		</header>

		<ul class="article-list">
			{#each paginated as article}
				<li class="article-card">
					<a href="/articles/{article.slug}" class="article-card__link">
						<div class="article-card__meta">
							<span class="article-card__category">{getCategoryLabel(article.category)}</span>
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

		<Pagination
			total={data.articles.length}
			{perPage}
			{currentPage}
			onPageChange={(p) => {
				currentPage = p;
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}}
		/>
	</div>
</section>

<style lang="scss">
	.tag-page {
		padding: var(--spacing-2xl) 0;

		&__header {
			margin-bottom: var(--spacing-xl);
		}

		&__label {
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--color-text-secondary);
			margin-bottom: var(--spacing-xs);
		}

		&__title {
			font-size: 1.75rem;
			font-weight: 700;
			margin-bottom: var(--spacing-xs);
		}

		&__count {
			font-size: 0.9375rem;
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
