/**
 * the live "Shiki, build-time" demo.
 *
 * The ONLY docs importer of `shiki`, which highlighter-isolation.spec.ts pins.
 * This is the first `+page.server.ts` in the repo: a server
 * `load` runs only at build/prerender time — the root layout sets
 * `prerender = true` and the docs site is adapter-static, so this executes
 * once, at build, and is never bundled into the client. `+page.svelte`
 * threads the resulting HTML string through CodeBlock's R19 `children`
 * escape hatch (`{@html data.shikiHtml}`); zero highlighter JS ships to the
 * browser.
 */
import { codeToHtml } from 'shiki';
import { shikiDemoSource } from '../../../../docs/samples/code-block-demo.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const shikiHtml = await codeToHtml(shikiDemoSource, {
		lang: 'svelte',
		theme: 'github-dark'
	});
	return { shikiHtml };
};
