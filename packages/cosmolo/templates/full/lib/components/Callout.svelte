<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		type?: 'info' | 'tip' | 'warning' | 'danger';
		title?: string;
		children: Snippet;
	}

	const { type = 'info', title, children }: Props = $props();
</script>

<aside class="callout callout-{type}">
	{#if title}
		<p class="callout-title">{title}</p>
	{/if}
	<div class="callout-body">
		{@render children()}
	</div>
</aside>

<style>
	.callout {
		border-left: 4px solid;
		padding: 0.75rem 1rem;
		margin: 1.25rem 0;
		border-radius: 0 4px 4px 0;
		background-color: var(--callout-bg, #f8f9fa);
	}

	.callout-info    { border-color: #3b82f6; }
	.callout-tip     { border-color: #10b981; }
	.callout-warning { border-color: #f59e0b; }
	.callout-danger  { border-color: #ef4444; }

	.callout-title {
		font-weight: 600;
		margin: 0 0 0.25rem;
	}

	.callout-body :global(p:last-child) {
		margin-bottom: 0;
	}
</style>
