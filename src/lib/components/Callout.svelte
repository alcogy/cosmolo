<script lang="ts">
	interface Props {
		type?: 'info' | 'warning' | 'danger' | 'tip';
		children: import('svelte').Snippet;
	}

	const { type = 'info', children }: Props = $props();
</script>

<aside class="callout callout--{type}" role="note">
	{@render children()}
</aside>

<style lang="scss">
	.callout {
		border-left: 4px solid var(--callout-color, var(--color-accent));
		background: var(--callout-bg, var(--color-bg-secondary));
		padding: var(--spacing-md) var(--spacing-lg);
		border-radius: 0 var(--border-radius) var(--border-radius) 0;
		margin: var(--spacing-lg) 0;

		&--info {
			--callout-color: #4a90d9;
			--callout-bg: #eef5fd;
		}

		&--tip {
			--callout-color: #27ae60;
			--callout-bg: #eafaf1;
		}

		&--warning {
			--callout-color: #f39c12;
			--callout-bg: #fef9ee;
		}

		&--danger {
			--callout-color: #e74c3c;
			--callout-bg: #fdf0ef;
		}
	}
</style>
