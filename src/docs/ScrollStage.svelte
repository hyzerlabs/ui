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
	 */
	interface Props {
		/** Stage height, and the height of each filler run above/below the content. */
		height?: string;
		children: Snippet;
	}

	let { height = '26rem', children }: Props = $props();
</script>

<div class="scroll-stage" style="height: {height}">
	<div class="scroll-stage-filler" style="height: {height}" aria-hidden="true">↓ scroll ↓</div>
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
	}
</style>
