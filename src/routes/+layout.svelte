<script lang="ts">
	import '../app.scss';
	import { siteConfig } from '$lib/config';

	interface Props {
		children: import('svelte').Snippet;
	}

	const { children }: Props = $props();
</script>

<svelte:head>
	<meta name="description" content={siteConfig.description} />
	<meta property="og:site_name" content={siteConfig.name} />
	<meta property="og:image" content="{siteConfig.url}/og-image.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content={siteConfig.twitterHandle} />
</svelte:head>

<div class="site-wrapper">
	<header class="site-header">
		<div class="container">
			<a href="/" class="site-header__title">{siteConfig.name}</a>
			<nav class="site-header__nav" aria-label="Site navigation">
				<a href="/">Articles</a>
				<!-- Add links to your static pages here, e.g.: <a href="/about">About</a> -->
			</nav>
		</div>
	</header>

	<main class="site-main">
		{@render children()}
	</main>

	<footer class="site-footer">
		<div class="container">
			<p class="site-footer__copy">
				&copy; {new Date().getFullYear()}
				{siteConfig.name}
			</p>
		</div>
	</footer>
</div>

<style lang="scss">
	.site-wrapper {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.site-header {
		border-bottom: 1px solid var(--color-border);
		height: var(--header-height);

		.container {
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		&__title {
			font-weight: 700;
			font-size: 1.125rem;
			color: var(--color-text-primary);
			text-decoration: none;

			&:hover {
				color: var(--color-accent);
			}
		}

		&__nav {
			display: flex;
			gap: var(--spacing-lg);

			a {
				color: var(--color-text-secondary);
				font-size: 0.9375rem;
				text-decoration: none;

				&:hover {
					color: var(--color-text-primary);
				}
			}
		}
	}

	.site-main {
		flex: 1;
	}

	.site-footer {
		border-top: 1px solid var(--color-border);
		padding: var(--spacing-xl) 0;
		margin-top: var(--spacing-2xl);

		&__copy {
			color: var(--color-text-secondary);
			font-size: 0.875rem;
		}
	}
</style>
