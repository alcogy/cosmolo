<script lang="ts">
	import Pagination from '$lib/components/Pagination.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	const perPage = 10;
	let currentPage = $state(1);

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		data.slug;
		currentPage = 1;
	});

	const paginated = $derived(
		data.articles.slice((currentPage - 1) * perPage, currentPage * perPage)
	);
</script>

<section>
	<div class="container">
		<header>
			<h1>{data.label}</h1>
			{#if data.description}
				<p>{data.description}</p>
			{/if}
		</header>

		{#if data.articles.length === 0}
			<p>No articles in this category yet.</p>
		{:else}
			<ul class="article-list">
				{#each paginated as article}
					<li>
						<a href="/articles/{article.slug}">
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
				total={data.articles.length}
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
