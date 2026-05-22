<script lang="ts">
	import { siteConfig } from '$lib/config';
	import { getCategoryLabel } from '$lib/categories';
	import Pagination from '$lib/components/Pagination.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	const perPage = siteConfig.articlesPerPage;

	let query = $state('');
	let currentPage = $state(1);

	const filtered = $derived(
		query.trim() === ''
			? data.articles
			: (() => {
					const q = query.toLowerCase();
					return data.articles.filter(
						(a) =>
							a.title.toLowerCase().includes(q) ||
							a.excerpt.toLowerCase().includes(q) ||
							getCategoryLabel(a.category).toLowerCase().includes(q)
					);
				})()
	);

	// Reset to page 1 whenever the query changes
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		query;
		currentPage = 1;
	});

	const paginated = $derived(filtered.slice((currentPage - 1) * perPage, currentPage * perPage));
</script>

<svelte:head>
	<title>{siteConfig.name}</title>
	<meta property="og:title" content={siteConfig.name} />
	<meta property="og:description" content={siteConfig.description} />
</svelte:head>

<section class="home">
	<div class="container">
		<h1 class="home__heading">Articles</h1>

		<div class="search">
			<label class="search__label" for="search-input">Search</label>
			<input
				id="search-input"
				class="search__input"
				type="search"
				placeholder="Search articles…"
				bind:value={query}
				autocomplete="off"
			/>
			{#if query.trim() !== ''}
				<p class="search__count">
					{filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
				</p>
			{/if}
		</div>

		{#if data.articles.length === 0}
			<p class="home__empty">No articles yet. Add your first article to <code>src/content/articles/</code>.</p>
		{:else if filtered.length === 0}
			<p class="home__empty">No articles matched your search.</p>
		{:else}
			<ul class="article-list">
				{#each paginated as article}
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

			<Pagination
				total={filtered.length}
				{perPage}
				{currentPage}
				onPageChange={(p) => {
					currentPage = p;
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}}
			/>
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

	.search {
		margin-bottom: var(--spacing-xl);

		&__label {
			display: block;
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--color-text-secondary);
			margin-bottom: var(--spacing-sm);
		}

		&__input {
			width: 100%;
			padding: var(--spacing-sm) var(--spacing-md);
			border: 1px solid var(--color-border);
			border-radius: var(--border-radius);
			background: var(--color-bg);
			color: var(--color-text-primary);
			font-size: 1rem;
			font-family: var(--font-sans);
			transition: border-color var(--transition-fast);
			box-sizing: border-box;

			&:focus {
				outline: none;
				border-color: var(--color-accent);
			}

			&::placeholder {
				color: var(--color-text-secondary);
			}
		}

		&__count {
			margin-top: var(--spacing-sm);
			font-size: 0.875rem;
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
