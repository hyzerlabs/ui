<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A self-contained scrollable stage for scroll-driven demos (Parallax):
	 * fixed height, its own scrollbar, with filler runway above and below the
	 * demo content so a full scroll-timeline pass fits inside the box without
	 * the surrounding docs page needing to scroll. `animation-timeline:
	 * view()` resolves against the nearest scroll container, so this is pure
	 * demo chrome, not a component API concern — the ResizableDemo.svelte
	 * precedent for demo-only interactive chrome.
	 *
	 * Keyboard-operable (WCAG 2.1.1): the rail-viewport pattern
	 * (Carousel.svelte's rail) — a tab stop with a role and a required label,
	 * so the box is reachable and nameable to assistive tech even though it
	 * carries no interactive role of its own.
	 */
	interface Props {
		/** Stage height, and the height of each filler run above/below the content. */
		height?: string;
		/** Accessible name for the scrollable region — required, one per demo. */
		ariaLabel: string;
		/**
		 * Set false to drop the TOP runway entirely, so the demo content is the
		 * very top of the stage's scrollable area — for a band that IS a page
		 * top (a hero) rather than a section passed on both sides. The bottom
		 * runway (the "rest of the page" below it) always stays. Default true.
		 */
		topRunway?: boolean;
		children: Snippet;
	}

	let { height = '26rem', ariaLabel, topRunway = true, children }: Props = $props();
</script>

<!--
	The rail-viewport pattern (Carousel.svelte): a labeled, focusable scroll
	region (WCAG 2.1.1) with no interactive role of its own.
-->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="scroll-stage" style="height: {height}" tabindex="0" role="group" aria-label={ariaLabel}>
	{#if topRunway}
		<div class="scroll-stage-filler" style="height: {height}" aria-hidden="true">↓ scroll ↓</div>
	{/if}
	{@render children()}
	<div class="scroll-stage-filler" style="height: {height}" aria-hidden="true">↑ scroll ↑</div>
</div>

<style>
	.scroll-stage {
		overflow-y: auto;
		overscroll-behavior-y: contain;
		border: 1px solid var(--hz-color-border, #6b7280);
		border-radius: var(--hz-radius-md, 0.5rem);
		/* A visible, slim scrollbar signals the box scrolls on its own — an
		 * auto-hiding overlay scrollbar (macOS default) would otherwise give
		 * no hint at rest. */
		scrollbar-gutter: stable;
		scrollbar-width: thin;
		scrollbar-color: var(--hz-color-border, #6b7280) transparent;
	}

	.scroll-stage-filler {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--hz-color-text-muted, #6b7280);
		font-size: var(--hz-font-size-sm, 0.875rem);
		/* Muted surface, distinct from the stage's own (unset/default)
		 * background — so the runway you scroll through reads as demo chrome,
		 * and the Parallax band sitting between the two fillers reads as the
		 * actual component, not more of the same scrollable padding. */
		background-color: var(--hz-color-surface-muted, #f3f4f6);
	}
</style>
