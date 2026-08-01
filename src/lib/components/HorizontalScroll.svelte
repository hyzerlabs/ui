<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '$lib/utils';

	// ---------------------------------------------------------------------------
	// HorizontalScroll (specs/60) — a full-viewport horizontally scrolling shell
	// whose children flow inline as panels. Native scroll container: the
	// browser owns touch panning, fling momentum, trackpad pan, shift+wheel,
	// the scrollbar, and arrow-key scrolling. This component adds exactly two
	// things the platform has no equivalent for: a wheel remap, ON BY DEFAULT
	// (amended 2026-07-31, user decision — plain vertical wheel input →
	// horizontal travel, never trapping, always handing the wheel back to the
	// page at either end; turn it off with `wheel={false}` for native-only
	// scrolling) and a Home/End jump on the inline axis. Layout family posture
	// (specs/03) — structural CSS only, no theme sheet.
	// ---------------------------------------------------------------------------

	/** deltaMode: 1 (line) approximation — the one tuning constant here. */
	const WHEEL_LINE_PX = 16;
	/** How long a remapped wheel burst suppresses `snap` after its last event. */
	const WHEEL_SETTLE_MS = 150;

	interface Props {
		as?: string;
		/** CSS scroll-snap at panel starts. Off by default — see R3. */
		snap?: boolean;
		/**
		 * Translate vertical wheel input into horizontal travel. On by default
		 * (amended 2026-07-31) — turn it off with `wheel={false}` for
		 * native-only scrolling (touch, trackpad, scrollbar, keyboard).
		 */
		wheel?: boolean;
		/** The panels, as direct children. */
		children?: Snippet;
		class?: string;
		[key: string]: unknown;
	}

	let {
		as = 'div',
		snap = false,
		wheel = true,
		children,
		class: className,
		...rest
	}: Props = $props();

	// $state so the wheel-listener effect re-runs if <svelte:element>
	// recreates the node (an `as` change) — a plain let would strand the
	// listener on the detached element while data-wheel kept advertising it.
	let rootEl: HTMLElement | undefined = $state();

	/** data-wheel reflects the ATTACHED LISTENER, not the prop — R5's
	 * effective-behavior doctrine. Absent server-side and pre-hydration. */
	let wheelActive = $state(false);
	/** data-wheeling — present while a remapped burst is in flight (R7). */
	let wheeling = $state(false);
	let settleTimer: ReturnType<typeof setTimeout> | undefined;

	// The Carousel.svelte / Video.svelte / Form.svelte local shape — copied,
	// not exported or refactored (R11).
	function prefersReducedMotion(): boolean {
		return (
			typeof window !== 'undefined' &&
			typeof window.matchMedia === 'function' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	function markWheeling() {
		wheeling = true;
		if (settleTimer) clearTimeout(settleTimer);
		settleTimer = setTimeout(() => {
			wheeling = false;
			settleTimer = undefined;
		}, WHEEL_SETTLE_MS);
	}

	/**
	 * R6 — a nested vertical scroller between the event target and the root
	 * wins scroll chaining while it still has room in the delta's direction.
	 * Known ceiling: a getComputedStyle walk per wheel event, bounded by DOM
	 * depth from target to root — cache the resolved scroller per e.target if
	 * this ever shows in a profile, not remove the rule.
	 */
	function nestedVerticalScrollerCanTake(e: WheelEvent): boolean {
		if (!rootEl || !(e.target instanceof Element)) return false;
		let node: Element | null = e.target;
		while (node && node !== rootEl) {
			const overflowY = getComputedStyle(node).overflowY;
			if (overflowY === 'auto' || overflowY === 'scroll') {
				const range = node.scrollHeight - node.clientHeight;
				if (range > 1) {
					const roomDown = node.scrollTop < range - 1;
					const roomUp = node.scrollTop > 1;
					if ((e.deltaY > 0 && roomDown) || (e.deltaY < 0 && roomUp)) return true;
				}
			}
			node = node.parentElement;
		}
		return false;
	}

	// R5 — the wheel remap, in order: (1) never touch zoom/native-horizontal
	// intent, (2) vertical-dominant only, (3) a nested vertical scroller with
	// room wins, (4) the end fall-through, (5) the direct, unanimated
	// scrollLeft assignment. Every early return leaves the event un-prevented,
	// so the browser does its normal thing with it (R6).
	function onWheel(e: WheelEvent) {
		if (!rootEl) return;
		if (e.ctrlKey || e.metaKey || e.shiftKey) return;
		if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
		if (nestedVerticalScrollerCanTake(e)) return;
		const max = rootEl.scrollWidth - rootEl.clientWidth;
		if (e.deltaY > 0 && rootEl.scrollLeft >= max - 1) return;
		if (e.deltaY < 0 && rootEl.scrollLeft <= 0) return;

		let delta = e.deltaY;
		if (e.deltaMode === 1) delta = e.deltaY * WHEEL_LINE_PX;
		else if (e.deltaMode === 2) delta = e.deltaY * rootEl.clientWidth;
		rootEl.scrollLeft += delta;
		e.preventDefault();
		markWheeling();
	}

	// R5/R11 — the listener must not exist at all when `wheel` is false (the
	// opt-out), and
	// `passive: false` must be explicit (addEventListener, not an onwheel
	// attribute) since preventDefault() is load-bearing. Flipping the prop
	// mid-session detaches via this same effect's cleanup.
	$effect(() => {
		if (!wheel || !rootEl) {
			wheelActive = false;
			return;
		}
		const el = rootEl;
		el.addEventListener('wheel', onWheel, { passive: false });
		wheelActive = true;
		return () => {
			el.removeEventListener('wheel', onWheel);
			wheelActive = false;
			if (settleTimer) {
				clearTimeout(settleTimer);
				settleTimer = undefined;
			}
			wheeling = false;
		};
	});

	// R4 — Home/End are the one keyboard exception: browsers map them to the
	// block axis, which this scroller has none of, so they'd otherwise be dead
	// keys. Guarded to the root itself (an input/textarea inside a panel keeps
	// its native caret-movement meaning) and to no modifier held.
	function onkeydown(e: KeyboardEvent) {
		if (!rootEl || e.target !== rootEl) return;
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
		const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth';
		if (e.key === 'Home') {
			e.preventDefault();
			rootEl.scrollTo({ left: 0, behavior });
		} else if (e.key === 'End') {
			e.preventDefault();
			rootEl.scrollTo({ left: rootEl.scrollWidth - rootEl.clientWidth, behavior });
		}
	}
</script>

<!--
	{...rest} spreads first so a colliding managed attribute (class,
	tabindex, data-*) loses to the component-managed value. tabindex="0" is
	the 58 R9 precedent: a scrollable region must be keyboard-operable
	(2.1.1), and a tab stop gives native arrow-key scrolling for free. No
	role and no name (R10) — a consumer whose shell is the page's main
	content passes role="region" aria-label="…" (or as="main") through rest.
-->
<svelte:element
	this={as}
	{...rest}
	bind:this={rootEl}
	class={cx('hz-horizontal-scroll', className)}
	tabindex="0"
	data-snap={snap ? '' : undefined}
	data-wheel={wheelActive ? '' : undefined}
	data-wheeling={wheeling ? '' : undefined}
	{onkeydown}
>
	{@render children?.()}
</svelte:element>

<style>
	/*
	 * R2 — the root is both the scroll container and the flex row: no inner
	 * track, since a single box has no "trailing padding is not scrollable"
	 * flexbox trap (this component ships no padding).
	 * - block-size: 100dvh default — dvh survives a mobile URL bar collapse;
	 *   override with --hz-horizontal-scroll-height or an inline style.
	 * - overflow-y: hidden — a single non-visible axis forces the other to
	 *   auto, which would otherwise grow a stray vertical scrollbar (58 R2).
	 * - overscroll-behavior-x: contain, NEVER both axes — R6's fail
	 *   condition. The x value guards against horizontal overscroll
	 *   triggering back-navigation; a y value (or the shorthand) would block
	 *   the vertical chaining the end fall-through depends on.
	 * - min-width: 0 — the Split/Grid guard, so the shell never props a
	 *   flex/grid parent open.
	 * - No scrollbar-width/scrollbar-color: native, visible, unstyled,
	 *   never hidden (Non-goals) — the Layout family ships no theme sheet,
	 *   and scrollbar presentation is exactly what one would own.
	 */
	.hz-horizontal-scroll {
		display: flex;
		block-size: var(--hz-horizontal-scroll-height, 100dvh);
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior-x: contain;
		gap: var(--hz-horizontal-scroll-gap, 0);
		min-width: 0;
	}

	/*
	 * Panels are plain direct children — no Panel subcomponent, no wrapper.
	 * :global() is required because a child rendered from the consumer's
	 * snippet carries the consumer's scope class, not this component's (the
	 * Split.svelte precedent for styling consumer-supplied children).
	 * scroll-snap-align is always set — inert until R3 turns snap-type on.
	 */
	.hz-horizontal-scroll > :global(*) {
		flex: 0 0 var(--hz-horizontal-scroll-panel-width, 100%);
		min-width: 0;
		scroll-snap-align: start;
	}

	/* R3 — snap, default off. Panels already carry scroll-snap-align: start
	 * above, inert while this resolves to none. */
	.hz-horizontal-scroll[data-snap] {
		scroll-snap-type: x mandatory;
	}

	/* R7 — snapping fights a live remapped wheel assignment every frame, so
	 * it is suppressed for the duration of a burst. Placed AFTER [data-snap]
	 * so source order — not specificity, which ties — decides. Clearing the
	 * attribute re-enables snap and the browser settles to the nearest panel
	 * on its own. */
	.hz-horizontal-scroll[data-wheeling] {
		scroll-snap-type: none;
	}
</style>
