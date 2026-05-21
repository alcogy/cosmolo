<script lang="ts">
	import { siteConfig } from '$lib/config';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const { page } = data;
</script>

<svelte:head>
	<title>{page.title} — {siteConfig.name}</title>
	<meta property="og:title" content="{page.title} — {siteConfig.name}" />
</svelte:head>

<article class="page">
	<div class="container">
		<h1 class="page__title">{page.title}</h1>
		<div class="page__body prose">
			{@html page.html}
		</div>
	</div>
</article>

<style lang="scss">
	.page {
		padding: var(--spacing-2xl) 0;

		&__title {
			font-size: 2rem;
			font-weight: 700;
			margin-bottom: var(--spacing-xl);
			padding-bottom: var(--spacing-lg);
			border-bottom: 1px solid var(--color-border);
		}
	}

	// Prose styles are inherited from articles/[slug]/+page.svelte via :global(.prose)
</style>
