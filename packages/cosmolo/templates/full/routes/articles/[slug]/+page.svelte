<script lang="ts">
	import { getCategoryLabel, getSvxComponent } from 'cosmolo';
	import config from '../../../../cosmolo.config';
	import type { PageData } from './$types';
	import type { Component } from 'svelte';

	const { data }: { data: PageData } = $props();

	const SvxComponent = $derived(getSvxComponent(config, data.article.slug) as Component | undefined);

	const hasToc = $derived(data.article.toc.length >= 2);
</script>

<article>
	<header>
		<div>
			<a href="/categories/{data.article.category}">
				{getCategoryLabel(config, data.article.category)}
			</a>
			{#if data.article.date}
				<time datetime={data.article.date}>{data.article.date}</time>
			{/if}
			{#if data.updatedAt && data.updatedAt !== data.article.date}
				<span>Updated: <time datetime={data.updatedAt}>{data.updatedAt}</time></span>
			{/if}
		</div>
		<h1>{data.article.title}</h1>
		<p>{data.article.excerpt}</p>
		{#if data.article.tags.length > 0}
			<div>
				{#each data.article.tags as tag}
					<a href="/tags/{tag}">#{tag}</a>
				{/each}
			</div>
		{/if}
	</header>

	{#if data.article.series}
		<nav>
			<p>Series: {data.article.series} (Part {data.article.seriesOrder ?? '?'} of {data.seriesTotal})</p>
			<div>
				{#if data.seriesPrev}
					<a href="/articles/{data.seriesPrev.slug}">&larr; {data.seriesPrev.title}</a>
				{/if}
				{#if data.seriesNext}
					<a href="/articles/{data.seriesNext.slug}">{data.seriesNext.title} &rarr;</a>
				{/if}
			</div>
		</nav>
	{/if}

	{#if hasToc}
		<nav aria-label="Table of contents">
			<p>Contents</p>
			<ol>
				{#each data.article.toc as entry}
					<li style="padding-left: {(entry.level - 2) * 1}rem">
						<a href="#{entry.id}">{entry.text}</a>
					</li>
				{/each}
			</ol>
		</nav>
	{/if}

	<div class="prose">
		{#if SvxComponent}
			<SvxComponent />
		{:else}
			{@html data.article.html}
		{/if}
	</div>

	<footer>
		<a href="/">&larr; Back to articles</a>

		{#if data.related.length > 0}
			<section>
				<h2>Related articles</h2>
				<ul>
					{#each data.related as rel}
						<li>
							<a href="/articles/{rel.slug}">
								<span>{rel.title}</span>
								<span>{rel.excerpt}</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</footer>
</article>
