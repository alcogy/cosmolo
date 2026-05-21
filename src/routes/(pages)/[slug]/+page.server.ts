import { getPage, getPageSlugs } from '$lib/pages';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = () => {
	return getPageSlugs().map((slug) => ({ slug }));
};

export const load: PageServerLoad = async ({ params }) => {
	try {
		const page = await getPage(params.slug);
		return { page };
	} catch {
		error(404, `Page not found: ${params.slug}`);
	}
};
