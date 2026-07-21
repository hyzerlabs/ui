<script lang="ts">
	/**
	 * "On this page" rail — docs chrome, not a library component.
	 *
	 * Entries are collected from the rendered DOM after each navigation:
	 * every visible `h2[id]` in the prose column. The `[id]` requirement plus
	 * the container exclusions keep demo content out — Hero/Alert/Modal render
	 * their own id'd headings inside `.doc-example` and `.sample-frame`, and
	 * those belong to the demos, not the page. Hidden headings (collapsed tab
	 * panels) are skipped via offsetParent.
	 *
	 * Scroll-spy marks the last heading above the top quarter of the viewport
	 * with aria-current="location"; positions are read live on each scroll
	 * frame, so late layout shifts (fonts, images) can't leave a stale map.
	 * The rail only renders with two or more entries — a single "Source" link
	 * is noise, not navigation.
	 */
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';

	interface TocEntry {
		id: string;
		label: string;
	}

	let entries = $state<TocEntry[]>([]);
	let activeId = $state('');

	let headings: HTMLHeadingElement[] = [];
	let raf = 0;

	function collect() {
		headings = Array.from(
			document.querySelectorAll<HTMLHeadingElement>('.docs-main-inner h2[id]')
		).filter((h) => !h.closest('.doc-example, .sample-frame') && h.offsetParent !== null);
		entries = headings.map((h) => ({ id: h.id, label: h.textContent?.trim() ?? '' }));
		updateActive();
	}

	function updateActive() {
		if (headings.length === 0) {
			activeId = '';
			return;
		}
		const threshold = window.innerHeight * 0.25;
		let current = headings[0].id;
		for (const h of headings) {
			if (h.getBoundingClientRect().top <= threshold) current = h.id;
			else break;
		}
		// Pinned to the bottom, the last section is the one being read even if
		// its heading never climbs past the threshold.
		if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
			current = headings[headings.length - 1].id;
		}
		activeId = current;
	}

	function onScroll() {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(updateActive);
	}

	onMount(() => {
		collect();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});

	afterNavigate(collect);
</script>

{#if entries.length >= 2}
	<nav class="docs-toc" aria-label="On this page">
		<p class="docs-toc-title">On this page</p>
		<ul>
			{#each entries as entry (entry.id)}
				<li>
					<a
						href="#{entry.id}"
						aria-current={activeId === entry.id ? 'location' : undefined}
						onclick={() => (activeId = entry.id)}
					>
						{entry.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}

<style>
	/* Hidden by default; the layout reserves the matching right gutter in
	 * .docs-main under the same breakpoint — keep the two in sync. Below it,
	 * breakout demos need the full content width (≥968px for split heroes). */
	.docs-toc {
		display: none;
	}

	@media (min-width: 1440px) {
		.docs-toc {
			display: block;
			position: fixed;
			top: 2rem;
			right: 1.5rem;
			width: 10rem;
			max-height: calc(100dvh - 4rem);
			overflow-y: auto;
			scrollbar-color: color-mix(in srgb, var(--hz-color-text, #000) 22%, transparent) transparent;
		}
	}

	.docs-toc-title {
		margin: 0 0 0.5rem;
		padding-left: 0.75rem;
		font-size: var(--hz-font-size-xs, 0.75rem);
		font-weight: var(--hz-font-weight-semibold, 600);
		color: var(--hz-color-text-muted, #6b7280);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		border-left: 1px solid var(--hz-color-border, #6b7280);
	}

	a {
		display: block;
		padding: 0.25rem 0 0.25rem 0.75rem;
		font-size: var(--hz-font-size-sm, 0.875rem);
		color: var(--hz-color-text-muted, #6b7280);
		text-decoration: none;
		overflow-wrap: break-word;
	}

	a:hover {
		color: var(--hz-color-text, #000);
	}

	/* Same active idiom as the sidebar: primary text + a left accent bar drawn
	 * with an inset shadow over the list's hairline, costing no layout. */
	a[aria-current='location'] {
		color: var(--hz-color-primary, #2563eb);
		box-shadow: inset 2px 0 0 var(--hz-color-primary, #2563eb);
		font-weight: var(--hz-font-weight-medium, 500);
	}
</style>
