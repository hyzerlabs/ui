<script lang="ts">
	import { getContext, untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import { DEV } from 'esm-env';
	import { cx } from '$lib/utils';

	// ---------------------------------------------------------------------------
	// ParallaxLayer (specs/59) — one drifting layer inside a Parallax band. The
	// drift is CSS scroll-driven animation (`animation-timeline: view()`) in
	// this file's own scoped style block: zero scroll listeners, zero JS motion.
	// Reduced motion and `@supports (animation-timeline: view())` both gate the
	// animation out entirely (R6), so an unsupported browser and a reduced-
	// motion visitor see the identical static, neutral, correctly-positioned
	// layer. Decorative and click-through by default (R8).
	// ---------------------------------------------------------------------------

	/** Matches Parallax.svelte's local (unexported) context key — see there. */
	const PARALLAX_CONTEXT = Symbol.for('hz-parallax');

	const FOCUSABLE_SELECTOR =
		'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), iframe, [contenteditable]';

	interface Props {
		/** Total horizontal travel across the band's view range. Number is px; string is a CSS length used verbatim. */
		x?: string | number;
		/** Total vertical travel. Same rules as `x`. */
		y?: string | number;
		/** z-index inside the band's own stacking context. Default -1 (behind content); 1 puts it in front. */
		z?: number;
		/** The layer's art. Non-interactive by contract (R8). */
		children?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let { x, y, z, class: className, children, ...rest }: Props = $props();

	/** A number is px; a string is a CSS length used verbatim (the Skeleton.svelte `toCss` idiom, reimplemented locally per spec — not shared/exported). */
	function toLength(value: string | number | undefined): string | undefined {
		if (value === undefined) return undefined;
		return typeof value === 'number' ? `${value}px` : value;
	}

	const travelX = $derived(toLength(x));
	const travelY = $derived(toLength(y));

	const hasParent = getContext(PARALLAX_CONTEXT) === true;

	let layerEl: HTMLDivElement | null = $state(null);

	// R10 — DEV-only warnings, evaluated once at creation (the Loading.svelte /
	// Skeleton.svelte `untrack()` precedent). None of these change behavior.
	// Zero-travel lives in the post-mount effect below (2026-07-31 amendment
	// to R10.2) — it has to read the resolved custom property, not the raw
	// prop, so a stylesheet-set `--hz-parallax-x`/`-y` (the R4-documented
	// omit-the-prop-and-set-it-in-CSS pattern) counts as real travel instead
	// of tripping a false "never moves" warning.
	if (DEV) {
		untrack(() => {
			if (!hasParent) {
				console.warn(
					'[hyzer-ui] <ParallaxLayer>: rendered outside a <Parallax> band. It will position ' +
						'against whatever ancestor is positioned, unclipped, and will leak.'
				);
			}

			if (typeof x === 'string' && x.includes('%')) {
				console.warn(
					'[hyzer-ui] <ParallaxLayer>: `x` is a percentage, which the coverage math does not ' +
						'hold for — use a length (px, rem, vw, …) instead.'
				);
			}
			if (typeof y === 'string' && y.includes('%')) {
				console.warn(
					'[hyzer-ui] <ParallaxLayer>: `y` is a percentage, which the coverage math does not ' +
						'hold for — use a length (px, rem, vw, …) instead.'
				);
			}
		});
	}

	/** Trimmed-empty or a length that resolves to 0 — a real length like "40px"/"-6rem" is not. */
	function isZeroTravel(raw: string): boolean {
		const value = raw.trim();
		if (!value) return true;
		const n = parseFloat(value);
		return !Number.isNaN(n) && n === 0;
	}

	function isScrollContainerOverflow(overflow: string): boolean {
		return overflow === 'auto' || overflow === 'scroll' || overflow === 'hidden';
	}

	/**
	 * specs/60 R9 — the band's nearest ancestor scroll container: a node whose
	 * computed overflow-x or overflow-y is auto/scroll/hidden (`clip` and
	 * `visible` are not scroll containers, so the band's own `overflow: clip`
	 * is correctly skipped), falling back to the document scrolling element.
	 */
	function nearestScrollContainer(from: Element): Element {
		let node: Element | null = from.parentElement;
		while (node) {
			const cs = getComputedStyle(node);
			if (isScrollContainerOverflow(cs.overflowX) || isScrollContainerOverflow(cs.overflowY)) {
				return node;
			}
			node = node.parentElement;
		}
		return document.scrollingElement ?? document.documentElement;
	}

	// R10.4/R9 — checked post-mount, since the layer's subtree is
	// consumer-supplied and the travel/scroller measurements need the real
	// layout. DEV-only, client-only (an effect never runs during SSR) — no
	// window/document access outside it.
	$effect(() => {
		if (!DEV || !layerEl) return;

		const cs = getComputedStyle(layerEl);
		if (
			isZeroTravel(cs.getPropertyValue('--hz-parallax-x')) &&
			isZeroTravel(cs.getPropertyValue('--hz-parallax-y'))
		) {
			console.warn(
				'[hyzer-ui] <ParallaxLayer>: `x` and `y` both resolve to zero travel — the layer never ' +
					'moves. Use a plain child instead.'
			);
		}

		const ariaHidden = (rest['aria-hidden'] as string | undefined) ?? 'true';
		if (ariaHidden === 'true' && layerEl.querySelector(FOCUSABLE_SELECTOR)) {
			console.warn(
				'[hyzer-ui] <ParallaxLayer>: contains focusable content while aria-hidden="true" — it ' +
					'will be unreachable to keyboard/assistive tech and unclickable (pointer-events: none). ' +
					'Move interactive content to a plain child of the Parallax band instead.'
			);
		}

		// specs/60 R9 — one check catches both new misuses: an axis="x" band
		// on a page with no horizontal scroller, and (more likely) a default
		// axis="y" band used as a panel inside a HorizontalScroll, whose
		// block axis never scrolls. Only meaningful when a band was found
		// (the "outside a Parallax band" warning above already covers the
		// no-band case).
		if (hasParent) {
			const band = layerEl.closest('.hz-parallax');
			if (band) {
				const axis = band.getAttribute('data-axis') === 'x' ? 'x' : 'y';
				const scroller = nearestScrollContainer(band);
				const hasRange =
					axis === 'x'
						? scroller.scrollWidth > scroller.clientWidth
						: scroller.scrollHeight > scroller.clientHeight;
				if (!hasRange) {
					console.warn(
						`[hyzer-ui] <ParallaxLayer>: the band's nearest scroller has no range on the '${axis}' ` +
							`axis, so the drift will not move. ` +
							(axis === 'x'
								? 'Confirm the band sits inside a horizontally scrolling container.'
								: 'If this band is a panel inside a <HorizontalScroll>, set axis="x" on it — ' +
									"the shell's own block axis never scrolls.")
					);
				}
			}
		}
	});
</script>

<!--
	aria-hidden="true" is stamped BEFORE the ...rest spread (the
	Skeleton.svelte exception to the library's usual rest-first convention),
	so a consumer can override it via rest for the rare case they want the
	layer exposed to assistive tech (R8).
-->
<div
	aria-hidden="true"
	{...rest}
	bind:this={layerEl}
	class={cx('hz-parallax-layer', className)}
	style:--hz-parallax-x={travelX}
	style:--hz-parallax-y={travelY}
	style:--hz-parallax-z={z}
>
	{@render children?.()}
</div>

<style>
	/*
	 * R3 — structure, sizing, and coverage bleed (always applied, outside
	 * both motion gates below):
	 * - position: absolute — never affects band height.
	 * - inset-block/inset-inline — the layer covers the band inflated by its
	 *   own travel distance in each axis, so at either extreme of the drift
	 *   the band edge is still covered and no seam appears. The private
	 *   bleed vars are the absolute travel via the comparison-function idiom
	 *   (CSS abs() isn't broadly supported yet): the larger of the value and
	 *   its negation is always the non-negative magnitude. Private,
	 *   `--_`-prefixed, and NOT a documented hook (the `--_loading-rm-scale`
	 *   precedent).
	 * - z-index — behind the band's content by default; 1 puts it in front.
	 * - pointer-events: none — layers are decorative and must never swallow
	 *   clicks aimed at the content they overlap (R8).
	 */
	.hz-parallax-layer {
		position: absolute;
		--_hz-parallax-bleed-x: max(var(--hz-parallax-x, 0px), calc(-1 * var(--hz-parallax-x, 0px)));
		--_hz-parallax-bleed-y: max(var(--hz-parallax-y, 0px), calc(-1 * var(--hz-parallax-y, 0px)));
		inset-block: calc(var(--_hz-parallax-bleed-y) / -2);
		inset-inline: calc(var(--_hz-parallax-bleed-x) / -2);
		z-index: var(--hz-parallax-z, -1);
		pointer-events: none;
	}

	/*
	 * R6 — both gates, nested, in this order. Reduced motion is the OUTER
	 * gate (the house posture — skeleton.css, carousel.css, accordion.css):
	 * under `reduce`, no animation is ever declared, so the layer paints at
	 * its neutral position, and an OS toggle mid-session stops/resumes the
	 * drift live, with no reload and no JS. @supports is mandatory, not
	 * decorative: without it, a browser that ignores `animation-timeline`
	 * would still apply `animation-name` with a 0s duration and fill: both,
	 * which paints every layer frozen at its END offset — visibly broken.
	 * Gating both makes the unsupported render identical to the reduced-
	 * motion render: static, neutral, correct.
	 */
	@media (prefers-reduced-motion: no-preference) {
		@supports (animation-timeline: view()) {
			/*
			 * R5 — translate, not transform, so a consumer's own transform
			 * (a rotate, a scale) on the layer composes instead of being
			 * clobbered. Neutral at the midpoint: the layer sits at its
			 * authored position when the band is centred in the viewport,
			 * and travels ±half the distance either side — total travel is
			 * the value the consumer reasons about. Svelte scopes this name
			 * automatically since it's referenced in this same component;
			 * left scoped on purpose, not forced global — the name is
			 * private and tests must not assert on it.
			 */
			@keyframes hz-parallax-drift {
				from {
					translate: calc(var(--hz-parallax-x, 0px) / -2) calc(var(--hz-parallax-y, 0px) / -2);
				}
				to {
					translate: calc(var(--hz-parallax-x, 0px) / 2) calc(var(--hz-parallax-y, 0px) / 2);
				}
			}

			.hz-parallax-layer {
				animation-name: hz-parallax-drift;
				/* A scroll-linked animation must track the scroll 1:1 — the
				 * --hz-ease-* tokens do not apply here (Non-goals). */
				animation-timing-function: linear;
				animation-fill-mode: both;
				animation-timeline: view();
				/* cover is the default view() range: the drift completes as
				 * the band travels from first entering the viewport to fully
				 * leaving it. Documented hook for entry/exit/contain. */
				animation-range: var(--hz-parallax-range, cover);
			}

			/*
			 * specs/60 R8 — axis="x" on the band. `view(inline)` (not
			 * `view(x)`): the default view() is view(block), so keeping the
			 * pair logical keeps both modes in one coordinate system and
			 * composes with the layer's own logical inset-* bleed. Reached
			 * through the cascade via the band's data-axis attribute — no
			 * JS, no context plumbing, no prop on the layer — so it stays
			 * live/reactive and applies to layers at any depth.
			 */
			:global(.hz-parallax[data-axis='x']) .hz-parallax-layer {
				animation-timeline: view(inline);
			}
		}
	}
</style>
