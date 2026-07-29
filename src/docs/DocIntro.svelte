<script lang="ts">
	/**
	 * Every docs page's heading and lead line, rendered one way.
	 *
	 * The title and the plain-text description come from the manifest entry
	 * for the current route — so adding a page means one manifest entry that
	 * feeds the sidebar, the route sweep, this heading and `llms.txt`, and the
	 * lead can never drift from what the nav promises.
	 *
	 * `lead` is an optional snippet for pages whose lead line carries markup —
	 * inline code, a link into another page, an emphasis. Those cannot survive
	 * as a plain string, and stripping them would make the leads worse to
	 * read. When a page passes one, the manifest description stays what it
	 * always was: the plain-text metadata `llms.txt` and search consume.
	 */
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { manifest, isSection, sectionPages, type ManifestPage } from './manifest';

	interface Props {
		/** Overrides the manifest label — for a heading that reads better than its nav entry. */
		title?: string;
		/** Rich lead markup; falls back to the manifest's plain description. */
		lead?: Snippet;
	}

	let { title, lead }: Props = $props();

	const entry = $derived(
		manifest
			.flatMap((e): ManifestPage[] => (isSection(e) ? sectionPages(e) : [e]))
			.find((p) => p.href === page.url.pathname)
	);
</script>

<div class="doc-intro">
	<h1>{title ?? entry?.label ?? ''}</h1>
	<p class="doc-description">
		{#if lead}{@render lead()}{:else}{entry?.description ?? ''}{/if}
	</p>
</div>
