<script lang="ts">
	import { getAllCategories } from '$lib/categories';
	import { siteConfig } from '$lib/config';

	interface Props {
		currentSlug?: string;
	}

	const { currentSlug }: Props = $props();

	const categories = getAllCategories();
</script>

<nav class="category-nav" aria-label="Browse categories">
	<ul class="category-nav__list">
		{#each categories as category}
			<li>
				<a
					href="/categories/{category.slug}"
					class="category-nav__link"
					class:category-nav__link--active={currentSlug === category.slug}
					aria-current={currentSlug === category.slug ? 'page' : undefined}
				>
					{category.label}
				</a>
			</li>
		{/each}
		<li>
			<a
				href="/categories/other"
				class="category-nav__link"
				class:category-nav__link--active={currentSlug === 'other'}
				aria-current={currentSlug === 'other' ? 'page' : undefined}
			>
				{siteConfig.fallbackCategoryLabel}
			</a>
		</li>
	</ul>
</nav>

<style lang="scss">
	.category-nav {
		&__list {
			list-style: none;
			display: flex;
			flex-wrap: wrap;
			gap: var(--spacing-sm);
		}

		&__link {
			display: inline-block;
			padding: var(--spacing-xs) var(--spacing-md);
			border: 1px solid var(--color-border);
			border-radius: var(--border-radius);
			color: var(--color-text-secondary);
			font-size: 0.875rem;
			transition: background var(--transition-fast), color var(--transition-fast);
			text-decoration: none;

			&:hover {
				background: var(--color-bg-secondary);
				color: var(--color-text-primary);
			}

			&--active {
				background: var(--color-accent);
				border-color: var(--color-accent);
				color: #fff;
			}
		}
	}
</style>
