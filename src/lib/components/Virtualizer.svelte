<script lang="ts" generics="T">
	import { untrack, type Snippet } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { cx } from '$lib/utils';

	interface Props {
		items: T[];
		itemHeight: number | ((item: T, index: number) => number);
		/**
		 * Viewport extent in px. Optional — when provided, the viewport is fixed
		 * and drives the window math deterministically (SSR-exact). When
		 * omitted, the viewport is fluid: the consumer CSS-sizes it and the
		 * component measures its own box at runtime.
		 */
		height?: number;
		measure?: boolean;
		overscan?: number;
		/** Renders one row. Receives the item and its absolute index in `items`. */
		row: Snippet<[T, number]>;
		class?: string;
		[key: string]: unknown;
	}

	let {
		items,
		itemHeight,
		height,
		measure = false,
		overscan = 3,
		row,
		class: className,
		...rest
	}: Props = $props();

	// Virtualizer-R5: the viewport ref + the scrollTop driving the window math.
	let viewportEl: HTMLDivElement | null = $state(null);
	let scrollTop = $state(0);

	// Virtualizer-R14: fluid mode's measured viewport box height, seeded 0 so
	// SSR / first paint renders the minimal 1 + overscan window until the
	// instance ResizeObserver's initial callback delivers the real height.
	// Unused (stays 0) when `height` is provided.
	let viewportHeight = $state(0);
	const effectiveHeight = $derived(height ?? viewportHeight);

	// Virtualizer-R6: measured-height cache, keyed by absolute index. A
	// SvelteMap so reads inside $derived.by register fine-grained reactivity.
	const measuredHeights = new SvelteMap<number, number>();

	// ---------------------------------------------------------------------------
	// Virtualizer-R2: height model.
	// ---------------------------------------------------------------------------

	const n = $derived(items.length);

	// Uniform fast path: itemHeight is a number and rows aren't measured, so
	// every row is the same height — O(1) offset math, no prefix-sum array.
	const isUniform = $derived(typeof itemHeight === 'number' && !measure);

	function itemHeightAt(index: number): number {
		return typeof itemHeight === 'function' ? itemHeight(items[index], index) : itemHeight;
	}

	/** Resolved height for a row: the measured cache wins in measured mode, else the itemHeight estimate/value. */
	function heightOf(index: number): number {
		if (measure) {
			const cached = measuredHeights.get(index);
			if (cached !== undefined) return cached;
		}
		return itemHeightAt(index);
	}

	// Variable/measured modes: a cached prefix-sum array, rebuilt whenever
	// items/itemHeight/measure change or a measured height is written (the
	// SvelteMap read above makes measuredHeights a tracked dependency).
	const offsets = $derived.by((): number[] => {
		if (isUniform) return [];
		const count = items.length;
		const arr = new Array<number>(count + 1);
		arr[0] = 0;
		for (let i = 0; i < count; i++) {
			arr[i + 1] = arr[i] + heightOf(i);
		}
		return arr;
	});

	const totalHeight = $derived(isUniform ? n * (itemHeight as number) : (offsets[n] ?? 0));

	function offsetAt(index: number): number {
		return isUniform ? index * (itemHeight as number) : (offsets[index] ?? 0);
	}

	/** Largest index i (0..n) with offset(i) <= y — O(1) uniform, binary search otherwise. */
	function indexForOffset(y: number): number {
		if (n === 0) return 0;
		if (isUniform) {
			return Math.min(n, Math.max(0, Math.floor(y / (itemHeight as number))));
		}
		let lo = 0;
		let hi = n;
		while (lo < hi) {
			const mid = lo + Math.ceil((hi - lo) / 2);
			if (offsets[mid] <= y) lo = mid;
			else hi = mid - 1;
		}
		return lo;
	}

	// ---------------------------------------------------------------------------
	// Virtualizer-R3: window math.
	// ---------------------------------------------------------------------------

	// Virtualizer-R3/R14: `effectiveHeight` is the fixed `height` prop when
	// provided, else the fluid-mode measured `viewportHeight`. In fluid mode
	// before the first measurement (viewportHeight still 0), `scrollTop +
	// effectiveHeight` is 0, so `last` resolves to `first` and the window
	// naturally collapses to the minimal 1 + overscan rows — no special case
	// needed.
	const first = $derived(indexForOffset(scrollTop));
	const startIndex = $derived(Math.max(0, first - overscan));
	const last = $derived(indexForOffset(scrollTop + effectiveHeight));
	const endIndex = $derived(Math.min(n, last + 1 + overscan));
	const offsetY = $derived(offsetAt(startIndex));
	const visibleItems = $derived(items.slice(startIndex, endIndex));

	// ---------------------------------------------------------------------------
	// Virtualizer-R5: scroll re-windowing — addEventListener in an $effect (not
	// an inline onscroll) so a consumer onscroll via ...rest is never clobbered.
	// scrollTop commits are coalesced with requestAnimationFrame: multiple
	// scroll events within a frame trigger a single re-window.
	// ---------------------------------------------------------------------------

	let pendingFrame: number | null = null;

	function onScroll() {
		if (pendingFrame !== null) return;
		pendingFrame = requestAnimationFrame(() => {
			pendingFrame = null;
			if (viewportEl) scrollTop = viewportEl.scrollTop;
		});
	}

	$effect(() => {
		const el = viewportEl;
		if (!el) return;
		el.addEventListener('scroll', onScroll);
		return () => {
			el.removeEventListener('scroll', onScroll);
			if (pendingFrame !== null) {
				cancelAnimationFrame(pendingFrame);
				pendingFrame = null;
			}
		};
	});

	// ---------------------------------------------------------------------------
	// Virtualizer-R6: measured heights via ResizeObserver, one per rendered row
	// (observed/unobserved as rows enter/leave the window via the `measureRow`
	// attachment). Created once per instance (SSR-safe: ResizeObserver is
	// undefined server-side); its lifecycle is disconnected via $effect cleanup.
	// ---------------------------------------------------------------------------

	const ro: ResizeObserver | null =
		typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResizeEntries) : null;

	function onResizeEntries(entries: ResizeObserverEntry[]) {
		for (const entry of entries) {
			const target = entry.target as HTMLElement;

			// Virtualizer-R14: the fluid-mode viewport itself is observed with
			// this same instance observer — branch on target identity (not
			// dataset absence) so its box updates viewportHeight instead of
			// going through the row-measurement path below.
			if (target === viewportEl) {
				const newViewportHeight =
					entry.borderBoxSize?.[0]?.blockSize ?? target.getBoundingClientRect().height;
				if (newViewportHeight !== viewportHeight) viewportHeight = newViewportHeight;
				continue;
			}

			const absIndex = Number(target.dataset.index);
			if (Number.isNaN(absIndex)) continue;

			const newHeight =
				entry.borderBoxSize?.[0]?.blockSize ?? target.getBoundingClientRect().height;
			const prevMeasured = measuredHeights.get(absIndex);
			// Change-gated: skip when the cache already holds this exact height,
			// so re-observing the same size (e.g. after our own scroll
			// compensation below) never re-triggers a measure→state loop.
			if (prevMeasured === newHeight) continue;

			const prevResolved = prevMeasured ?? itemHeightAt(absIndex);
			const delta = newHeight - prevResolved;
			// Capture BEFORE writing the cache: `first` is derived from offsets,
			// which depend on measuredHeights, so reading it after the write
			// below would already reflect the new (uncompensated) height.
			const wasAboveViewport = absIndex < first;
			measuredHeights.set(absIndex, newHeight);

			// Scroll anchoring: a row above the viewport top changing height
			// would otherwise visually shift the rows currently in view — hold
			// them in place by adjusting scrollTop by the same delta, in the
			// same frame. A row at/below `first` growing reflows naturally.
			if (delta !== 0 && wasAboveViewport && viewportEl) {
				viewportEl.scrollTop += delta;
				scrollTop = viewportEl.scrollTop;
			}
		}
	}

	$effect(() => {
		return () => ro?.disconnect();
	});

	// Virtualizer-R1/R10: the managed height style, spread onto the viewport
	// AFTER ...rest so a fixed numeric `height` wins over a conflicting rest
	// `style`. In fluid mode this is an EMPTY object (not `{ style: undefined
	// }`) — spreading `{}` contributes no key at all, so it never clobbers a
	// consumer's own `style` (e.g. `height: 100%`) passed through ...rest,
	// which is exactly how a fluid viewport gets CSS-sized.
	const heightStyleAttrs = $derived(height !== undefined ? { style: `height: ${height}px` } : {});

	/** Attachment: observes a row's box while it's in the DOM, unobserves on row teardown. */
	function measureRow(node: HTMLElement) {
		if (!measure || !ro) return;
		ro.observe(node);
		return () => ro.unobserve(node);
	}

	// Virtualizer-R14: in fluid mode (no `height` prop), observe the viewport
	// element itself with the same instance ResizeObserver so its measured box
	// drives the window math. Observed only while fluid — a numeric `height`
	// unobserves (the effect re-runs, tearing down the prior observation).
	// observe()'s first callback delivers the real height on mount, resolving
	// the minimal SSR window to the true one — no fallback constant.
	$effect(() => {
		if (height !== undefined || !ro) return;
		const el = viewportEl;
		if (!el) return;
		ro.observe(el);
		return () => ro.unobserve(el);
	});

	// Virtualizer-R7: a wholesale `items` replacement invalidates the
	// index-keyed cache — entries for indices the old array measured are
	// meaningless against the new one. Clear it and re-measure the rows
	// currently in the DOM directly: the ResizeObserver alone can't repopulate
	// a reused row whose box didn't change (it only reports size *changes*).
	// Runs post-render (before paint), so the repopulated cache re-derives the
	// window within the same flush. Per-element mutation/append that keeps the
	// array reference does not clear (documented v1 limitation).
	let measuredItems: T[] | null = null;
	$effect(() => {
		if (items === measuredItems) return;
		const isFirstRun = measuredItems === null;
		measuredItems = items;
		if (isFirstRun) return;
		const el = viewportEl;
		untrack(() => {
			measuredHeights.clear();
			if (!measure || !el) return;
			for (const node of el.querySelectorAll<HTMLElement>('.hz-virtualizer-row')) {
				const absIndex = Number(node.dataset.index);
				if (!Number.isNaN(absIndex)) measuredHeights.set(absIndex, node.offsetHeight);
			}
		});
	});
</script>

<!--
	Virtualizer-R1: viewport > sizer (full-height spacer) > window (offset-
	translated) > rows. Virtualizer-R9: no role/aria-*/tabindex anywhere — the
	consumer owns all semantics via the row snippet and ...rest on the viewport.
	Virtualizer-R10: ...rest spread first so component-managed class/style win.
-->
<div {...rest} {...heightStyleAttrs} bind:this={viewportEl} class={cx('hz-virtualizer', className)}>
	<div class="hz-virtualizer-sizer" style="height: {totalHeight}px">
		<div class="hz-virtualizer-window" style="transform: translateY({offsetY}px)">
			{#each visibleItems as item, k (startIndex + k)}
				{@const absIndex = startIndex + k}
				<div
					class="hz-virtualizer-row"
					data-index={absIndex}
					style={measure ? undefined : `height: ${heightOf(absIndex)}px`}
					{@attach measureRow}
				>
					{@render row(item, absIndex)}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	/*
	 * Virtualizer-R12: structural only, no chrome. scrollbar-gutter: stable is
	 * a layout-stability property (reserves the scrollbar track) not visual
	 * chrome. All dimensional values (height/totalHeight/translateY/row
	 * height) are inline styles computed from props/state, not tokens.
	 */
	.hz-virtualizer {
		overflow-y: auto;
		position: relative;
		scrollbar-gutter: stable;
	}

	.hz-virtualizer-sizer {
		position: relative;
		width: 100%;
	}

	.hz-virtualizer-window {
		position: absolute;
		top: 0;
		inset-inline: 0;
	}
</style>
