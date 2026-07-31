import { buildSearchIndex } from '../../docs/searchIndex';

export const prerender = true;

const sources = import.meta.glob('/src/routes/docs/**/+page.svelte', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

export function GET(): Response {
	return new Response(JSON.stringify(buildSearchIndex(sources)), {
		headers: { 'content-type': 'application/json' }
	});
}
