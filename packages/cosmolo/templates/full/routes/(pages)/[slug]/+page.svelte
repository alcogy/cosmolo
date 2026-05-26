<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<article>
	<div class="container">
		<h1>{data.page.title}</h1>
		<div class="prose">
			{@html data.page.html}
		</div>
	</div>
</article>
