<script lang="ts">
	import Pagination from '$lib/components/Pagination.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	const perPage = 10;
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

<section>
	<div class="container">
		<header>
			<p>Tag</p>
			<h1>#{data.tag}</h1>
			<p>{data.articles.length} article{data.articles.length !== 1 ? 's' : ''}</p>
		</header>

		<ul class="article-list">
			{#each paginated as article}
				<li>
					<a href="/articles/{article.slug}">
						<span>{article.category}</span>
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
	</div>
</section>
