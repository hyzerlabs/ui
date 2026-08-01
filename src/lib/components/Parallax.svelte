<script lang="ts">
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { cx } from '$lib/utils';

	// ---------------------------------------------------------------------------
	// Parallax (specs/59) — a single-band layout primitive whose child
	// ParallaxLayer(s) drift as the band passes through the viewport, driven by
	// the page scroll. The mechanism is CSS scroll-driven animation
	// (`animation-timeline: view()`, authored in ParallaxLayer.svelte) — zero
	// scroll listeners, zero JS motion. This component only supplies the
	// positioned/clipped/isolated containing block every layer positions
	// against; structural-only, Layout family posture (specs/03) — no theme
	// sheet, no color.
	// ---------------------------------------------------------------------------

	/**
	 * Context key ParallaxLayer reads to detect a missing Parallax ancestor
	 * (dev-warn only — R10). Not exported: `Symbol.for` keys the realm-global
	 * registry, so an identical call in ParallaxLayer.svelte resolves to the
	 * same symbol without the two components needing to share a module
	 * binding (plain instance-script `export` isn't a real module export in
	 * runes mode; a `<script module>` block would be the alternative, but
	 * isn't needed for a value this small).
	 */
	const PARALLAX_CONTEXT = Symbol.for('hz-parallax');

	interface Props {
		as?: string;
		/**
		 * Which axis of the band's nearest scroller drives the drift. `'y'`
		 * (default) is the page-scroll behavior of spec 59. `'x'` tracks the
		 * band's horizontal crossing — for a band inside a `HorizontalScroll`.
		 */
		axis?: 'y' | 'x';
		/** Layers and foreground content. */
		children?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let { as = 'div', axis = 'y', children, class: className, ...rest }: Props = $props();

	setContext(PARALLAX_CONTEXT, true);
</script>

<!--
	{...rest} spreads first so a colliding managed attribute (class,
	data-axis) loses to the component-managed value — the library's
	rest-first convention. data-axis is the component's first data-* (60
	R8) — stamped for both values so themes and tests can target either
	(58 R1's posture).
-->
<svelte:element this={as} {...rest} class={cx('hz-parallax', className)} data-axis={axis}>
	{@render children?.()}
</svelte:element>

<style>
	/*
	 * R2 — exactly four structural declarations:
	 * - position: relative — the containing block every layer positions against.
	 * - overflow: clip, NOT hidden — hidden establishes a scroll container,
	 *   which would become the nearest scrollport for view() and kill the
	 *   timeline; clip clips without one, so the page stays the timeline
	 *   source. Also guarantees a horizontally drifting layer can never
	 *   produce a page-level horizontal scrollbar.
	 * - isolation: isolate — a stacking context, so a z:-1 layer stays behind
	 *   the band's own content and never escapes behind ancestors or the page
	 *   background.
	 * - min-width: 0 — the guard Split/Grid already ship, so a wide layer
	 *   never props a flex/grid parent open.
	 */
	.hz-parallax {
		position: relative;
		overflow: clip;
		isolation: isolate;
		min-width: 0;
	}
</style>
