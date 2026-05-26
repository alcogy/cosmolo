<script lang="ts">
	interface Props {
		total: number;
		perPage: number;
		currentPage: number;
		onPageChange: (page: number) => void;
	}

	const { total, perPage, currentPage, onPageChange }: Props = $props();

	const totalPages = $derived(Math.ceil(total / perPage));

	const pageItems = $derived.by(() => {
		if (totalPages <= 7) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}
		const items: number[] = [];
		const delta = 2;
		const left = currentPage - delta;
		const right = currentPage + delta;

		items.push(1);
		if (left > 2) items.push(0);

		for (let p = Math.max(2, left); p <= Math.min(totalPages - 1, right); p++) {
			items.push(p);
		}

		if (right < totalPages - 1) items.push(0);
		items.push(totalPages);

		return items;
	});
</script>

{#if totalPages > 1}
	<nav aria-label="Pagination">
		<button
			disabled={currentPage === 1}
			onclick={() => onPageChange(currentPage - 1)}
			aria-label="Previous page"
		>
			&larr;
		</button>

		{#each pageItems as item}
			{#if item === 0}
				<span aria-hidden="true">&hellip;</span>
			{:else}
				<button
					onclick={() => onPageChange(item)}
					aria-label="Page {item}"
					aria-current={item === currentPage ? 'page' : undefined}
				>
					{item}
				</button>
			{/if}
		{/each}

		<button
			disabled={currentPage === totalPages}
			onclick={() => onPageChange(currentPage + 1)}
			aria-label="Next page"
		>
			&rarr;
		</button>
	</nav>
{/if}
