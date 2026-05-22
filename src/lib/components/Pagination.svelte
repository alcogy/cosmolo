<script lang="ts">
	interface Props {
		total: number;
		perPage: number;
		currentPage: number;
		onPageChange: (page: number) => void;
	}

	const { total, perPage, currentPage, onPageChange }: Props = $props();

	const totalPages = $derived(Math.ceil(total / perPage));

	/**
	 * Builds a page list with ellipsis markers (represented as 0) when there
	 * are many pages. Always shows first/last and a window around currentPage.
	 */
	const pageItems = $derived.by(() => {
		if (totalPages <= 7) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}
		const items: number[] = [];
		const delta = 2;
		const left = currentPage - delta;
		const right = currentPage + delta;

		items.push(1);
		if (left > 2) items.push(0); // left ellipsis

		for (let p = Math.max(2, left); p <= Math.min(totalPages - 1, right); p++) {
			items.push(p);
		}

		if (right < totalPages - 1) items.push(0); // right ellipsis
		items.push(totalPages);

		return items;
	});
</script>

{#if totalPages > 0}
	<nav class="pagination" aria-label="Pagination">
		<button
			class="pagination__btn pagination__btn--arrow"
			disabled={currentPage === 1}
			onclick={() => onPageChange(currentPage - 1)}
			aria-label="Previous page"
		>
			&#8592;
		</button>

		{#each pageItems as item}
			{#if item === 0}
				<span class="pagination__ellipsis" aria-hidden="true">…</span>
			{:else}
				<button
					class="pagination__btn"
					class:pagination__btn--active={item === currentPage}
					onclick={() => onPageChange(item)}
					aria-label="Page {item}"
					aria-current={item === currentPage ? 'page' : undefined}
				>
					{item}
				</button>
			{/if}
		{/each}

		<button
			class="pagination__btn pagination__btn--arrow"
			disabled={currentPage === totalPages}
			onclick={() => onPageChange(currentPage + 1)}
			aria-label="Next page"
		>
			&#8594;
		</button>
	</nav>
{/if}

<style lang="scss">
	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-xs);
		margin-top: var(--spacing-xl);

		&__btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			min-width: 2rem;
			height: 2rem;
			padding: 0 var(--spacing-xs);
			border: 1px solid var(--color-border);
			border-radius: var(--border-radius);
			background: var(--color-bg);
			color: var(--color-text-primary);
			font-size: 0.875rem;
			cursor: pointer;
			transition: border-color var(--transition-fast), background var(--transition-fast);

			&:hover:not(:disabled) {
				border-color: var(--color-accent);
				color: var(--color-accent);
			}

			&:disabled {
				opacity: 0.35;
				cursor: default;
			}

			&--active {
				background: var(--color-accent);
				border-color: var(--color-accent);
				color: #fff;
				font-weight: 600;

				&:hover {
					background: var(--color-accent-hover);
					border-color: var(--color-accent-hover);
					color: #fff;
				}
			}

			&--arrow {
				font-size: 1rem;
			}
		}

		&__ellipsis {
			color: var(--color-text-secondary);
			font-size: 0.875rem;
			padding: 0 var(--spacing-xs);
			user-select: none;
		}
	}
</style>
