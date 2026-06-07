<script lang="ts">
	import { getCategoryLabel } from 'cosmolo';
	import Pagination from '$lib/components/Pagination.svelte';
	import config from '../../cosmolo.config';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	const perPage = $derived(data.articlesPerPage);

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
							getCategoryLabel(config, a.category).toLowerCase().includes(q)
					);
				})()
	);

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		query;
		currentPage = 1;
	});

	const paginated = $derived(filtered.slice((currentPage - 1) * perPage, currentPage * perPage));
</script>

<section>
	<div class="container">
		<h1>Articles</h1>

		<div>
			<input
				type="search"
				placeholder="Search articles…"
				bind:value={query}
				autocomplete="off"
			/>
			{#if query.trim() !== ''}
				<p>{filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
			{/if}
		</div>

		{#if data.articles.length === 0}
			<p>No articles yet.</p>
		{:else if filtered.length === 0}
			<p>No articles matched your search.</p>
		{:else}
			<ul>
				{#each paginated as article}
					<li>
						<a href="/articles/{article.slug}">
							<span>{getCategoryLabel(config, article.category)}</span>
							{#if article.date}
								<time datetime={article.date}>{article.date}</time>
							{/if}
							<h2>{article.title}</h2>
							<p>{article.excerpt}</p>
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
