<script lang="ts" generics="T">
	import { tick, untrack, type Snippet } from 'svelte';
	import { DEV } from 'esm-env';
	import { cx } from '$lib/utils';
	import IconChevronLeft from '$lib/icons/generated/chevron-left.svelte';
	import IconChevronRight from '$lib/icons/generated/chevron-right.svelte';
	import Button from './Button.svelte';

	interface Props {
		items: T[];
		/** Accessible name for the carousel region. Required. */
		ariaLabel: string;
		/** Active slide (bindable). In rail layout, the item nearest the scroll origin. */
		index?: number;
		/**
		 * `'single'` (default) is the sliding-track, one-slide-per-view layout.
		 * `'rail'` swaps it for a native horizontal-scroll row with several
		 * slides visible at once — a different mechanism, not a variant: the
		 * browser owns scrolling, momentum, touch, wheel, and keyboard scroll
		 * keys.
		 */
		layout?: 'single' | 'rail';
		/**
		 * Rail only. `true` (default) snaps to item starts (`scroll-snap-type: x
		 * mandatory`); `false` is free continuous momentum scrolling. Ignored
		 * outside `layout="rail"`.
		 */
		snap?: boolean;
		/** Wrap from the last slide to the first and vice versa. */
		loop?: boolean;
		/**
		 * Pointer drag to slide (default true). Disabling it leaves keyboard,
		 * button, and dot navigation untouched. Consumed here — not forwarded as
		 * the native `draggable` attribute.
		 */
		draggable?: boolean;
		/**
		 * `'visible'` (default) is today's always-shown control row. `'focus'`
		 * keeps the row in the DOM and fully operable but visually hides it
		 * until `:hover`/`:focus-within` reveals it — the WCAG 2.5.7 drag
		 * alternative, presentation-only (–R4).
		 */
		controls?: 'visible' | 'focus';
		/**
		 * Opt-in continuous boundary wrap: with `loop`, every ±1 wrap step
		 * (drag settle, buttons, an adjacent-wrap dot click, arrow keys) settles
		 * through a hidden clone instead of sweeping back through the row.
		 * Inert without `loop`.
		 */
		seamless?: boolean;
		/**
		 * Rail + `loop` only. Drops `inert` from the loop's clone slides so
		 * hover-driven UI (tooltips, hover styles) still fires on the clones
		 * visible near the wrap seam. Clones stay `aria-hidden`; setting this
		 * asserts the slide content has no focusable elements (links, buttons,
		 * inputs) — those would otherwise be Tab-reachable while hidden from
		 * assistive tech. Dev builds warn if one is found inside a clone.
		 */
		interactiveClones?: boolean;
		/** Position display: the "1 / 3" counter, or clickable slide-picker dots. */
		indicator?: 'counter' | 'dots';
		prevLabel?: string;
		nextLabel?: string;
		/** Accessible name per slide; defaults to "{n} of {total}". */
		slideLabel?: (item: T, index: number) => string;
		/** Accessible name per dot; defaults to "Go to slide {n} of {total}". */
		dotLabel?: (index: number, count: number) => string;
		onchange?: ((index: number) => void) | undefined;
		/** Renders one slide's content. */
		slide: Snippet<[T, number]>;
		class?: string;
		[key: string]: unknown;
	}

	let {
		items,
		ariaLabel,
		index = $bindable(0),
		layout = 'single',
		snap = true,
		loop = false,
		draggable = true,
		controls = 'visible',
		seamless = false,
		interactiveClones = false,
		indicator = 'counter',
		prevLabel = 'Previous slide',
		nextLabel = 'Next slide',
		slideLabel,
		dotLabel = (i, c) => `Go to slide ${i + 1} of ${c}`,
		onchange,
		slide,
		class: className,
		...rest
	}: Props = $props();

	const count = $derived(items.length);
	const canPrev = $derived(loop ? count > 1 : index > 0);
	const canNext = $derived(loop ? count > 1 : index < count - 1);
	// seamless is only meaningful with loop — the hook reflects
	// effective behavior, never advertising a wrap that cannot happen. It is
	// also inert in rail (R10/R5): rail's loop is inherently continuous, so
	// there is nothing to opt into, and data-seamless must never stamp there.
	const seamlessActive = $derived(layout !== 'rail' && seamless && loop);

	function go(next: number) {
		if (count === 0) return;
		const target = loop ? (next + count) % count : Math.min(count - 1, Math.max(0, next));
		if (target !== index) {
			index = target;
			onchange?.(target);
		}
		// Rail (R4): go() is the shared index/onchange funnel for both layouts.
		// Recording the assignment here — even when target === index — lets the
		// "external index write" effect below tell an outside bind:index write
		// apart from a scroll-derived update that routed back through here, so
		// a scroll-derived change never re-triggers its own programmatic scroll.
		lastRailIndex = target;
	}

	// ------------------------------------------------------------------
	// Seamless boundary wrap — every ±1 wrap step crossing the
	// first/last boundary settles through an inert clone of the opposite end
	// instead of go()'s plain rewind, so the track never sweeps backward
	// through the intervening slides. Adjacent-only: a caller decides the
	// step's direction and only asks for a wrap at the exact boundary; any
	// other move (multi-slide dot jump, Home/End) calls go() directly, no
	// clone. go() remains the single funnel for the index/onchange contract —
	// this only wraps its ±1 boundary move with a visual.
	// ------------------------------------------------------------------

	function wrapKind(current: number, dir: 1 | -1): 'forward' | 'backward' | null {
		if (!seamlessActive || count <= 1) return null;
		if (dir === 1 && current === count - 1) return 'forward';
		if (dir === -1 && current === 0) return 'backward';
		return null;
	}

	function step(dir: 1 | -1) {
		const target = index + dir;
		const kind = wrapKind(index, dir);
		if (kind) {
			seamlessWrap(target, kind);
		} else {
			go(target);
		}
	}

	function dotClick(i: number) {
		if (count > 0) {
			if (i === (index + 1) % count) {
				const kind = wrapKind(index, 1);
				if (kind) {
					seamlessWrap(i, kind);
					return;
				}
			} else if (i === (index - 1 + count) % count) {
				const kind = wrapKind(index, -1);
				if (kind) {
					seamlessWrap(i, kind);
					return;
				}
			}
		}
		go(i);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			step(-1);
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			step(1);
		} else if (e.key === 'Home') {
			e.preventDefault();
			// Absolute first, not a wrap neighbor — always a direct go(), never
			// a clone, even when it numerically coincides with a boundary.
			go(0);
		} else if (e.key === 'End') {
			e.preventDefault();
			go(count - 1);
		}
	}

	// ------------------------------------------------------------------
	// Pointer drag (R3–R6)
	// ------------------------------------------------------------------

	// The one piece of reactive drag state the view needs: the live px offset
	// and whether a horizontal drag is underway. Everything else is bookkeeping
	// that must not trigger re-renders, so it stays in plain module-local vars.
	let dragOffset = $state(0);
	let dragging = $state(false);

	let trackEl: HTMLDivElement | undefined;
	let viewportEl: HTMLDivElement | undefined;

	let pointerId: number | null = null;
	let startX = 0;
	let startY = 0;
	let axis: 'undecided' | 'horizontal' | 'vertical' = 'undecided';
	// Raw horizontal delta (undamped) — drives the release decision, while
	// dragOffset (damped at the ends) drives only the visual.
	let lastDx = 0;
	// Did the gesture cross into a real drag? Gates click-through.
	let dragged = false;
	// Recent (x, time) samples for the release velocity.
	let samples: { x: number; t: number }[] = [];

	// Horizontal movement to commit to a drag; below it, the press is a click.
	const DRAG_THRESHOLD = 8;
	// Flick speed (px/ms) that advances a slide regardless of distance.
	const FLICK_VELOCITY = 0.5;
	// Resistance factor past the first/last slide.
	const RUBBER_BAND = 0.35;

	function viewportWidth(): number {
		return viewportEl?.clientWidth || 1;
	}

	// scrollLeft captured at the moment a mouse drag commits (axis resolves
	// horizontal), so each move can set the scroll position by the raw pointer
	// delta relative to where the drag started (R6).
	let railStartScrollLeft = 0;

	// R6 (amended 2026-07-31): the drag surface. In rail mode the pointer
	// handlers live on the viewport, not the track — an inert clone slide
	// (R7) isn't hit-testable, so a press over one resolves to its nearest
	// hit-testable ancestor, which is the viewport, not the track; listening
	// there means a drag started over a clone still engages. Single mode is
	// unchanged (the track). Pointer capture follows the same element.
	function dragSurfaceEl(): HTMLElement | undefined {
		return layout === 'rail' ? viewportEl : trackEl;
	}

	function onpointerdown(e: PointerEvent) {
		// Before every guard below: a touch pan is the case the drag path bows out
		// of (it returns two lines down), and it still has to end a glide's wrap
		// hold — the user is scrolling the rail themselves now.
		endRailGlide();
		if (!draggable || count <= 1) return;
		// R6: rail's mouse drag never engages for touch/pen — the browser
		// already pans and flings them, and capturing them would replace good
		// native behavior with worse JS.
		if (layout === 'rail' && e.pointerType !== 'mouse') return;
		// Primary button only; touch/pen report button 0 too.
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		pointerId = e.pointerId;
		startX = e.clientX;
		startY = e.clientY;
		axis = 'undecided';
		lastDx = 0;
		dragged = false;
		samples = [{ x: e.clientX, t: e.timeStamp }];
	}

	function onpointermove(e: PointerEvent) {
		if (pointerId !== e.pointerId) return;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		if (axis === 'undecided') {
			if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
			// Whichever axis the gesture commits to first wins. Vertical means
			// the page scrolls and we bow out; touch-action: pan-y makes the
			// browser do this for touch, this covers mouse.
			axis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
			if (axis === 'horizontal') {
				dragging = true;
				if (layout === 'rail') railStartScrollLeft = viewportEl?.scrollLeft ?? 0;
				try {
					dragSurfaceEl()?.setPointerCapture(pointerId);
				} catch {
					// No active pointer to capture (e.g. a synthetic event) — the
					// drag still works, it just isn't captured outside the element.
				}
			} else {
				pointerId = null;
				return;
			}
		}
		if (axis !== 'horizontal') return;

		// We own the gesture now — stop text selection / native drag.
		e.preventDefault();
		dragged = true;
		lastDx = dx;
		samples.push({ x: e.clientX, t: e.timeStamp });
		if (samples.length > 5) samples.shift();
		if (layout === 'rail') {
			// R6: 1:1 by the raw pointer delta, no rubber-band — the container's
			// own overscroll handles the ends. scrollTo, not a scrollLeft
			// assignment: grabbing the rail mid-glide has to cancel the chevron's
			// smooth scroll, and only an explicit instant scroll does that.
			viewportEl?.scrollTo({ left: railStartScrollLeft - dx, behavior: 'instant' });
		} else {
			dragOffset = resist(dx);
		}
	}

	// The physical ends always resist, whether or not loop is set — the track
	// holds a finite row of slides, so tracking 1:1 past the last one would
	// reveal blank space. Wrapping (when loop) happens on release, not by
	// dragging into the void.
	function resist(dx: number): number {
		const atStart = index === 0 && dx > 0;
		const atEnd = index === count - 1 && dx < 0;
		return atStart || atEnd ? dx * RUBBER_BAND : dx;
	}

	function releaseVelocity(): number {
		if (samples.length < 2) return 0;
		const first = samples[0];
		const last = samples[samples.length - 1];
		const dt = last.t - first.t;
		return dt > 0 ? (last.x - first.x) / dt : 0;
	}

	function endDrag(commit: boolean) {
		if (pointerId != null) {
			try {
				dragSurfaceEl()?.releasePointerCapture(pointerId);
			} catch {
				// capture may already be gone (pointercancel) — ignore.
			}
		}
		if (layout === 'rail') {
			// R6: no JS momentum/inertia on release — clearing data-dragging
			// re-enables scroll-snap (the viewport's :has() rule), and the
			// browser settles to the nearest snap point (or free-scroll stays
			// exactly where the finger left it) with no velocity/settle logic here.
			pointerId = null;
			axis = 'undecided';
			dragging = false;
			return;
		}
		let target = index;
		let dir: 1 | -1 | null = null;
		if (commit) {
			// Decide from the raw pointer delta, not the damped visual offset, so a
			// flick at a rubber-banding end still registers.
			const passedHalf = Math.abs(lastDx) > viewportWidth() * 0.5;
			const flicked = Math.abs(releaseVelocity()) > FLICK_VELOCITY;
			if ((passedHalf || flicked) && lastDx !== 0) {
				// Step one neighbor and defer to go(): it clamps when loop is off and
				// wraps when it's on, so drag loops exactly when the consumer opts in.
				dir = lastDx < 0 ? 1 : -1;
				target = index + dir;
			}
		}
		pointerId = null;
		axis = 'undecided';
		const kind = dir != null ? wrapKind(index, dir) : null;
		if (kind) {
			// Seamless: fold the drag's live (possibly rubber-banded) offset
			// into a continuous forward settle through a clone, rather than the
			// plain go() rewind below.
			seamlessWrap(target, kind);
		} else {
			// Clear the drag first (re-enables the transition), then move: the track
			// animates in one smooth settle from where the finger left it to rest.
			dragging = false;
			dragOffset = 0;
			go(target);
		}
	}

	function onpointerup(e: PointerEvent) {
		if (pointerId !== e.pointerId) return;
		endDrag(true);
	}

	function onpointercancel(e: PointerEvent) {
		if (pointerId !== e.pointerId) return;
		endDrag(false);
	}

	// Native drag-and-drop of slide content (images are draggable by default)
	// would start its own ghost-drag on mousedown and cancel the pointer
	// sequence — so a drag begun on an image wouldn't work. Suppress it while
	// dragging is enabled; the drag still fires a click for non-dragged presses.
	function onDragStart(e: DragEvent) {
		if (draggable && count > 1) e.preventDefault();
	}

	// A press that turned into a drag must not also fire the click it lands on
	// (e.g. a link inside a slide). Capture phase so it beats the target's own
	// handler; one-shot, so a subsequent real click passes through.
	function onclickcapture(e: MouseEvent) {
		if (dragged) {
			e.preventDefault();
			e.stopPropagation();
			dragged = false;
		}
	}

	// translateX in one expression: rest position plus the live drag offset.
	const trackTransform = $derived(`translateX(calc(-1 * ${index} * 100% + ${dragOffset}px))`);

	// ------------------------------------------------------------------
	// Seamless wrap settle (R6 mechanism) — an inert clone of the opposite
	// end, appended/prepended next to the boundary; the track animates
	// forward into it, then the transform silently resets (no transition) to
	// the real target once index has already moved there. Because the clone
	// mirrors the real target slide's content, the reset frame is visually
	// identical to the settled frame — no perceptible jump.
	// ------------------------------------------------------------------

	// Non-null only while a wrap settle is in flight; overrides trackTransform
	// on the track so the wrap's own animation isn't fighting the plain
	// index/dragOffset-derived value.
	let wrapTransform = $state<string | null>(null);
	// Which end's clone is mounted, if any. 'end' = clone of items[0],
	// appended after the real slides (forward wrap, last → first). 'start' =
	// clone of the last item, prepended before the real slides (backward
	// wrap, first → last) — R7 keeps both outside the real-slide index space.
	let clone = $state<'start' | 'end' | null>(null);
	let wrapBusy = false;

	const displayTransform = $derived(wrapTransform ?? trackTransform);

	function prefersReducedMotion(): boolean {
		return (
			typeof window !== 'undefined' &&
			typeof window.matchMedia === 'function' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	function nextFrame(): Promise<void> {
		return new Promise((resolve) => requestAnimationFrame(() => resolve()));
	}

	// Resolves once the track's transform transition ends, or after a
	// generous fallback so a browser that skips the event (or a transition
	// that resolves to the same computed value) never hangs the sequence.
	function waitForSettle(): Promise<void> {
		return new Promise((resolve) => {
			const el = trackEl;
			if (!el) {
				resolve();
				return;
			}
			let done = false;
			const finish = () => {
				if (done) return;
				done = true;
				el.removeEventListener('transitionend', onEnd);
				resolve();
			};
			const onEnd = (e: TransitionEvent) => {
				if (e.target === el && e.propertyName === 'transform') finish();
			};
			el.addEventListener('transitionend', onEnd);
			setTimeout(finish, 600);
		});
	}

	async function seamlessWrap(target: number, kind: 'forward' | 'backward') {
		if (wrapBusy || prefersReducedMotion()) {
			// No sweep to hide (33 R7 already makes every move instant) — the
			// seamless path is a no-op visual here, so it must not introduce its
			// own motion or clone.
			dragging = false;
			dragOffset = 0;
			go(target);
			return;
		}
		wrapBusy = true;
		const fromIndex = index;
		const fromOffset = dragOffset;
		// A leading clone (backward wrap) physically occupies one flex slot
		// before real slide 0 — the freeze value below compensates for that
		// shift so mounting it introduces no visual change on its own.
		const shift = kind === 'backward' ? 1 : 0;
		const frozen = `translateX(calc(-1 * ${fromIndex + shift} * 100% + ${fromOffset}px))`;
		const revealTarget =
			kind === 'forward' ? `translateX(calc(-1 * ${count} * 100%))` : 'translateX(0%)';

		if (shift !== 0 && trackEl) trackEl.style.transition = 'none';
		clone = kind === 'forward' ? 'end' : 'start';
		wrapTransform = frozen;
		dragging = false;
		dragOffset = 0;
		await tick();
		if (shift !== 0) {
			// Let the compensated, transition-suppressed frame paint before
			// re-enabling the transition for the reveal animation below.
			await nextFrame();
			await nextFrame();
			if (trackEl) trackEl.style.transition = '';
		}
		await nextFrame();
		wrapTransform = revealTarget;
		await waitForSettle();
		go(target);
		// Silent reset: index has already moved to the real target, whose
		// clone-mirrored content is pixel-identical to what's on screen — swap
		// the transform source back with the transition off so nothing moves.
		if (trackEl) trackEl.style.transition = 'none';
		wrapTransform = null;
		clone = null;
		await nextFrame();
		await nextFrame();
		if (trackEl) trackEl.style.transition = '';
		wrapBusy = false;
	}

	// ------------------------------------------------------------------
	// Rail layout (specs/58) — a native overflow-x scroller. The browser owns
	// scrolling, momentum, touch, wheel, and keyboard scroll keys; this section
	// adds only what the platform doesn't: an index derived from scroll
	// position, page-based buttons, and the loop clone/teleport buffer.
	// ------------------------------------------------------------------

	// Real-slide element refs, indexed by real (non-clone) index — the target
	// of every programmatic rail scroll (R4) and of the nearest-item scan (R4).
	let railSlideEls = $state<(HTMLDivElement | null)[]>([]);
	// The leading clone copy's element refs (R7) — only index 0 is read (the
	// clone of items[0], "leadingCloneOfItem0"), measured live each frame.
	let leadCloneEls = $state<(HTMLDivElement | null)[]>([]);

	// Whether an animated programmatic rail scroll is still running (R5), the
	// position it was last seen at, and how many frames it has held that
	// position. The loop wrap (R7) can't be applied while a glide is in flight —
	// see railFrame().
	let railGliding = false;
	let railGlideLastPos = -1;
	let railGlideStill = 0;

	// R11: clones are client-only. False through SSR and the pre-hydration
	// frame — the plain rail (real items only) renders and scrolls correctly
	// with CSS alone before this ever flips.
	let mounted = $state(false);
	// R7 degenerate guard: whether the real block actually overflows the
	// viewport, measured once against the pre-clone layout. loop is inert
	// (no clones, no teleport) when this is false.
	let railCloneable = $state(false);
	// Also the "loop is effectively active" reading behind data-loop below —
	// the same doctrine as data-seamless: the hook reflects effective
	// behavior, never advertising a loop that's inert (not yet mounted, or
	// content that doesn't overflow).
	const showRailClones = $derived(layout === 'rail' && loop && mounted && railCloneable);

	// R5 disabled-state metrics, refreshed by the same rAF-throttled scroll
	// handler that derives `index` (and once, right after mount). Optimistic
	// pre-measurement defaults (R5): prev disabled, next enabled when count > 1.
	let railAtStart = $state(true);
	let railAtEnd = $state(false);
	// Defaults to false (not measured yet) so a pre-measurement `loop` never
	// reports "always enabled" before overflow is known — R5's pre-measurement
	// row (prev disabled, next enabled) holds regardless of the loop prop.
	let railHasOverflow = $state(false);
	// loop only ever disables nothing while it's actually doing something —
	// the degenerate guard (no overflow) falls through to the plain
	// atStart/atEnd read, which is already both-disabled in that case.
	const railLoopEffective = $derived(layout === 'rail' && loop && railHasOverflow);
	const canPrevRail = $derived(railLoopEffective || !railAtStart);
	const canNextRail = $derived(railLoopEffective || !railAtEnd);

	// Guards the "external index write" effect below against reacting to our
	// own scroll-derived assignments (go() keeps this in sync on every call —
	// see go() above) — the one-way sync R4 requires.
	let lastRailIndex = index;
	let railRaf = 0;

	function railOverflows(): boolean {
		if (!viewportEl || !trackEl) return false;
		return trackEl.scrollWidth > viewportEl.clientWidth + 1;
	}

	function measureRail() {
		if (!viewportEl) return;
		const el = viewportEl;
		const TOL = 1;
		railHasOverflow = el.scrollWidth > el.clientWidth + TOL;
		railAtStart = el.scrollLeft <= TOL;
		railAtEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - TOL;
	}

	// R4: the real slide whose start is nearest the current scroll position —
	// matches what snapping lands on and never flickers at a fractional offset.
	function nearestRailIndex(): number {
		if (!viewportEl) return index;
		const pos = viewportEl.scrollLeft;
		let best = 0;
		let bestDist = Infinity;
		for (let i = 0; i < count; i++) {
			const el = railSlideEls[i];
			if (!el) continue;
			const dist = Math.abs(el.offsetLeft - pos);
			if (dist < bestDist) {
				bestDist = dist;
				best = i;
			}
		}
		return best;
	}

	// R7: the teleport. The period is measured live from the DOM every frame —
	// no cache, no ResizeObserver, so a resize or font load can't invalidate it.
	function correctTeleport() {
		if (!viewportEl) return;
		const realStart = railSlideEls[0];
		const leadClone = leadCloneEls[0];
		if (!realStart || !leadClone) return;
		const period = realStart.offsetLeft - leadClone.offsetLeft;
		if (period <= 0) return;
		const TOL = 1;
		const pos = viewportEl.scrollLeft;
		// A mid-drag teleport shifts the live scroll position by one period —
		// railStartScrollLeft (the drag's own origin, R6) has to shift with it,
		// or the very next move's `railStartScrollLeft - dx` assignment fights
		// this correction by a full period and can clamp the drag at the
		// scroll range's edge for the rest of the gesture.
		// scrollTo, not a scrollLeft assignment: assigning mid-animation doesn't
		// cancel a running smooth scroll, so the browser keeps animating to the
		// destination it committed to and overwrites the teleport on the next
		// frame. An instant scrollTo aborts the animation first.
		if (pos < realStart.offsetLeft - TOL) {
			viewportEl.scrollTo({ left: pos + period, behavior: 'instant' });
			railStartScrollLeft += period;
		} else if (pos >= realStart.offsetLeft + period - TOL) {
			viewportEl.scrollTo({ left: pos - period, behavior: 'instant' });
			railStartScrollLeft -= period;
		}
	}

	// Set the moment any real interaction reaches the rail — a click, a
	// drag, or a native scroll — so the deferred initial settle below (which
	// can fire well after mount when the rail starts out hidden) never
	// clobbers a position the user already moved to in the meantime.
	let railInteracted = false;

	// rAF-throttled: one recompute per frame, not per scroll event (R4).
	function onRailScroll() {
		railInteracted = true;
		if (railRaf) return;
		railRaf = requestAnimationFrame(railFrame);
	}

	function railFrame() {
		railRaf = 0;
		if (!viewportEl) return;
		const pos = viewportEl.scrollLeft;
		// A browser-run smooth scroll animates toward a destination it committed
		// to when it started: repositioning mid-flight is silently overwritten on
		// the next frame, so a wrap applied then is lost and the rail stalls at
		// the boundary. While a glide is in flight the wrap waits for it to stop;
		// the clone buffer is a full period wide on each side, so the glide always
		// has an identical-looking copy to land in first. The hold covers the glide
		// alone: any user input on the rail ends it (endRailGlide), so a wheel or a
		// drag that interrupts one wraps on the spot the way it always has, rather
		// than riding a stale hold out of the buffer into the scroll edge.
		//
		// Two still frames, not one: a composited scroll commits its offset to the
		// main thread asynchronously, so a janked frame — or the sub-pixel tail of
		// the ease-out — can read the same position twice mid-animation.
		if (pos === railGlideLastPos) railGlideStill++;
		else railGlideStill = 0;
		railGlideLastPos = pos;
		if (railGliding && railGlideStill < 2) {
			// Re-arm off the frame, not the scroll event: the glide's final frame
			// is also its last scroll event, so nothing else would come back to
			// apply the wrap once the rail settles.
			railRaf = requestAnimationFrame(railFrame);
		} else {
			railGliding = false;
			// Teleport correction happens before the index recompute, in the same
			// frame, so a wrap never shows through as a spurious index change.
			if (showRailClones) correctTeleport();
		}
		measureRail();
		const nearest = nearestRailIndex();
		if (nearest !== index) go(nearest);
	}

	// Every animated programmatic rail scroll goes through these two, so the
	// wrap-holding rule above has one place to be set and one to be released.
	function startRailGlide() {
		railGliding = true;
		railGlideStill = 0;
		railGlideLastPos = -1;
	}

	function endRailGlide() {
		railGliding = false;
	}

	// R4: the platform primitive for every programmatic rail scroll — no manual
	// scrollLeft arithmetic, no offset bookkeeping, vertical position untouched.
	function scrollRailTo(i: number, behavior: ScrollBehavior) {
		if (behavior === 'smooth') startRailGlide();
		railSlideEls[i]?.scrollIntoView({ inline: 'start', block: 'nearest', behavior });
	}

	// R5: prev/next page by one viewport width — the storefront convention.
	// With snap on, the browser resolves the landing position to an item
	// boundary for free.
	function railPage(dir: 1 | -1) {
		if (!viewportEl) return;
		railInteracted = true;
		const smooth = !prefersReducedMotion();
		// Tell the scroll handler a glide is starting, so it holds any loop wrap
		// until the animation settles rather than losing it mid-flight (R7). The
		// instant path (reduced motion, R8) clears it instead of leaving a stale
		// hold behind for the next scroll.
		if (smooth) startRailGlide();
		else endRailGlide();
		viewportEl.scrollBy({
			left: dir * viewportEl.clientWidth,
			behavior: smooth ? 'smooth' : 'auto'
		});
	}

	// Scroll instantly to the initial index (R4) and take the first
	// post-mount measurement (R5). Uses viewportEl.scrollTo directly rather
	// than scrollRailTo/scrollIntoView: scrollIntoView's default vertical
	// "nearest" can yank a partly-off-screen ancestor (e.g. a rail just below
	// the fold, or the loop case, which must always position to the real
	// block's start) fully into view even though only the rail's own
	// horizontal position needs setting — R4 leaves vertical page position
	// alone. scrollTo is element-scoped and can never touch an ancestor.
	// Two reasons the write itself can still be skipped (measureRail() always
	// runs regardless): the rail was already interacted with while this was
	// deferred (see the mount effect below — the current position is then the
	// user's, not stale startup state, and forcing it back would undo their
	// input); or the target is already at the current scroll position.
	function settleInitialRailScroll() {
		lastRailIndex = index;
		const target = railSlideEls[index];
		const alreadyThere =
			target != null &&
			viewportEl != null &&
			Math.abs(target.offsetLeft - viewportEl.scrollLeft) <= 1;
		if (!railInteracted && !alreadyThere && target != null && viewportEl != null) {
			viewportEl.scrollTo({ left: target.offsetLeft, behavior: 'auto' });
		}
		measureRail();
	}

	// Measure the degenerate guard against the plain (pre-clone) layout, then
	// flip `mounted` (client-only clone mount, R7/R11). Only the clone case
	// needs to wait a tick for the DOM to catch up before positioning —
	// without clones there is nothing to wait for, so the initial scroll
	// happens in this same synchronous pass and can never race a click that
	// lands in the same frame.
	function readyMeasureAndMount() {
		const cloneable = loop && railOverflows();
		railCloneable = cloneable;
		mounted = true;
		if (cloneable) {
			tick().then(settleInitialRailScroll);
		} else {
			settleInitialRailScroll();
		}
	}

	// Mount: a rail that first lays out inside a hidden container (an inactive
	// tab panel, a closed accordion, display:none) measures 0×0 — reading that
	// as "no overflow" would wrongly skip loop's clones (R7) and wrongly read
	// "already at the scroll end" (R5, an empty range's start also reads as
	// its end). A one-shot IntersectionObserver defers the measurement to the
	// moment the rail actually has a real box, whenever that is, without
	// polling or a persistent watcher — it disconnects after the first
	// intersecting callback either way.
	$effect(() => {
		if (layout !== 'rail' || !viewportEl) return;
		// The scroll frame re-arms itself while a glide is held, so leaving one
		// pending on unmount would leave a chain running, not a single frame.
		const cancelRailFrame = () => {
			if (railRaf) cancelAnimationFrame(railRaf);
			railRaf = 0;
		};
		if (typeof IntersectionObserver === 'undefined') {
			untrack(readyMeasureAndMount);
			return cancelRailFrame;
		}
		const el = viewportEl;
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					io.disconnect();
					untrack(readyMeasureAndMount);
				}
			},
			{ threshold: 0 }
		);
		io.observe(el);
		return () => {
			io.disconnect();
			cancelRailFrame();
		};
	});

	// R4: a consumer's bind:index write (or any external change) scrolls the
	// rail toward that item; a scroll-derived assignment (routed through go(),
	// which keeps lastRailIndex in sync) is a no-op here, so it never feeds
	// back into a programmatic scroll.
	$effect(() => {
		const i = index;
		if (layout !== 'rail') return;
		untrack(() => {
			if (i === lastRailIndex) return;
			lastRailIndex = i;
			scrollRailTo(i, prefersReducedMotion() ? 'auto' : 'smooth');
		});
	});

	// R10: dev-only, inert-prop warnings — evaluated once at creation.
	if (DEV) {
		untrack(() => {
			if (layout === 'rail' && indicator === 'dots') {
				console.warn(
					'[hyzer-ui] <Carousel>: `indicator="dots"` has no effect in layout="rail" — a multi-visible rail has no single position to indicate.'
				);
			}
			if (layout === 'rail' && seamless) {
				console.warn(
					'[hyzer-ui] <Carousel>: `seamless` has no effect in layout="rail" — rail\'s loop is already inherently continuous.'
				);
			}
			if (layout !== 'rail' && snap === false) {
				console.warn('[hyzer-ui] <Carousel>: `snap={false}` has no effect outside layout="rail".');
			}
			if (interactiveClones && (layout !== 'rail' || !loop)) {
				console.warn(
					'[hyzer-ui] <Carousel>: `interactiveClones` has no effect outside layout="rail" with `loop` — there are no clone slides.'
				);
			}
		});
	}

	// interactiveClones is the consumer's assertion that slide content has no
	// focusable elements — a focusable descendant of an aria-hidden clone
	// (without inert) is Tab-reachable while invisible to assistive tech, a
	// WCAG 4.1.2 failure. Verify the assertion in dev once clones mount.
	$effect(() => {
		if (!DEV || !interactiveClones || !showRailClones || !trackEl) return;
		const focusable = trackEl.querySelector(
			'[data-clone] :is(a[href], button, input, select, textarea, iframe, [tabindex], [contenteditable])'
		);
		if (focusable) {
			console.warn(
				'[hyzer-ui] <Carousel>: `interactiveClones` asserts the slide content has no focusable elements, but a loop clone contains one — it is keyboard-reachable while hidden from assistive tech. Remove `interactiveClones` or the focusable content:',
				focusable
			);
		}
	});
</script>

<!--
	APG grouped-content carousel. There is deliberately NO auto-rotation, so
	the slide viewport can be an aria-live=polite region: slide changes are
	announced via each slide's aria-label ("2 of 5" by default). Arrow keys
	work while focus is anywhere inside the carousel. The slides sit in a
	sliding track; off-screen slides are inert so only the active
	one is exposed and focusable.
-->
<div
	{...rest}
	class={cx('hz-carousel', className)}
	role="group"
	aria-roledescription="carousel"
	aria-label={ariaLabel}
	data-layout={layout}
	data-controls={controls}
	data-snap={layout === 'rail' && snap ? '' : undefined}
	data-loop={showRailClones ? '' : undefined}
	data-seamless={seamlessActive ? '' : undefined}
	onkeydown={layout === 'rail' ? undefined : onKeydown}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- R9: tabindex="0" in rail is deliberate — a keyboard-operable WCAG 2.1.1
	     scroll region. No role/aria-label here: it already sits inside the
	     root's role="group"/aria-roledescription="carousel" with its required
	     ariaLabel, and a second copy of that name on a nested element is noise. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="hz-carousel-viewport"
		bind:this={viewportEl}
		aria-live={layout === 'single' ? 'polite' : undefined}
		tabindex={layout === 'rail' ? 0 : undefined}
		onscroll={layout === 'rail' ? onRailScroll : undefined}
		onwheel={layout === 'rail' ? endRailGlide : undefined}
		style:cursor={layout === 'rail' && draggable && count > 1
			? dragging
				? 'grabbing'
				: 'grab'
			: undefined}
		style:user-select={layout === 'rail' && draggable && count > 1 ? 'none' : undefined}
		onpointerdown={layout === 'rail' ? onpointerdown : undefined}
		onpointermove={layout === 'rail' ? onpointermove : undefined}
		onpointerup={layout === 'rail' ? onpointerup : undefined}
		onpointercancel={layout === 'rail' ? onpointercancel : undefined}
	>
		<div
			class="hz-carousel-track"
			bind:this={trackEl}
			style:transform={layout === 'rail' ? undefined : displayTransform}
			style:cursor={layout !== 'rail' && draggable && count > 1
				? dragging
					? 'grabbing'
					: 'grab'
				: undefined}
			style:user-select={layout !== 'rail' && draggable && count > 1 ? 'none' : undefined}
			data-dragging={dragging ? '' : undefined}
			onpointerdown={layout === 'rail' ? undefined : onpointerdown}
			onpointermove={layout === 'rail' ? undefined : onpointermove}
			onpointerup={layout === 'rail' ? undefined : onpointerup}
			onpointercancel={layout === 'rail' ? undefined : onpointercancel}
			{onclickcapture}
			ondragstart={onDragStart}
		>
			{#if clone === 'start'}
				<!-- Seamless: a clone of the last slide, prepended so a
				     backward wrap (first → last) can settle forward into it. Outside
				     the real-slide index space, always inert/aria-hidden, never
				     counted in count/dots/status, never focusable. -->
				<div class="hz-carousel-slide" data-clone inert aria-hidden="true">
					{@render slide(items[count - 1], count - 1)}
				</div>
			{/if}
			{#if showRailClones}
				<!-- R7: a full leading copy of items, so a loop rail can begin
				     scrolled into the middle copy with a full copy of slack in each
				     direction. Outside the real-slide index space, never counted,
				     never focusable. -->
				{#each items as item, i (`hz-carousel-lead-${i}`)}
					<div
						class="hz-carousel-slide"
						data-clone
						inert={!interactiveClones}
						aria-hidden="true"
						bind:this={leadCloneEls[i]}
					>
						{@render slide(item, i)}
					</div>
				{/each}
			{/if}
			{#each items as item, i (i)}
				<div
					class="hz-carousel-slide"
					role="group"
					aria-roledescription="slide"
					aria-label={slideLabel ? slideLabel(item, i) : `${i + 1} of ${count}`}
					data-active={layout === 'single' && i === index ? '' : undefined}
					inert={layout === 'single' && i !== index}
					bind:this={railSlideEls[i]}
				>
					{@render slide(item, i)}
				</div>
			{/each}
			{#if showRailClones}
				<!-- R7: a full trailing copy, mirroring the leading one above. -->
				{#each items as item, i (`hz-carousel-trail-${i}`)}
					<div class="hz-carousel-slide" data-clone inert={!interactiveClones} aria-hidden="true">
						{@render slide(item, i)}
					</div>
				{/each}
			{/if}
			{#if clone === 'end'}
				<!-- Seamless: a clone of the first slide, appended so a
				     forward wrap (last → first) can settle forward into it. -->
				<div class="hz-carousel-slide" data-clone inert aria-hidden="true">
					{@render slide(items[0], 0)}
				</div>
			{/if}
		</div>
	</div>

	{#if count > 1}
		<div class="hz-carousel-controls">
			<Button
				variant="ghost"
				intent="neutral"
				size="sm"
				class="hz-carousel-prev"
				ariaLabel={prevLabel}
				disabled={!(layout === 'rail' ? canPrevRail : canPrev)}
				onclick={() => (layout === 'rail' ? railPage(-1) : step(-1))}
			>
				{#snippet iconStart()}<IconChevronLeft />{/snippet}
			</Button>
			{#if layout !== 'rail'}
				{#if indicator === 'dots'}
					<!-- Slide pickers: each dot is a labeled button (aria-current marks
					     the active slide); position changes still announce via the
					     viewport live region, so screen readers keep "{n} of {total}". -->
					<div class="hz-carousel-dots">
						{#each { length: count }, i (i)}
							<button
								type="button"
								class="hz-carousel-dot"
								aria-label={dotLabel(i, count)}
								aria-current={i === index ? 'true' : undefined}
								data-active={i === index ? '' : undefined}
								onclick={() => dotClick(i)}
							></button>
						{/each}
					</div>
				{:else}
					<!-- Decorative — the live region announces "{n} of {total}" already. -->
					<span class="hz-carousel-status" aria-hidden="true">{index + 1} / {count}</span>
				{/if}
			{/if}
			<Button
				variant="ghost"
				intent="neutral"
				size="sm"
				class="hz-carousel-next"
				ariaLabel={nextLabel}
				disabled={!(layout === 'rail' ? canNextRail : canNext)}
				onclick={() => (layout === 'rail' ? railPage(1) : step(1))}
			>
				{#snippet iconStart()}<IconChevronRight />{/snippet}
			</Button>
		</div>
	{/if}
</div>

<style>
	.hz-carousel {
		display: block;
	}

	/* The clip window — the track slides behind this. Rail overrides this to
	 * a real horizontal scroller below; overflow-y stays hidden there too — a
	 * single non-visible axis forces the other to auto, which would otherwise
	 * grow a stray vertical scrollbar. */
	.hz-carousel-viewport {
		overflow: hidden;
	}

	/* The sliding row. One slide per view; the transform is an inline style.
	 * touch-action: pan-y lets vertical page scroll through while we claim the
	 * horizontal axis. */
	.hz-carousel-track {
		display: flex;
		touch-action: pan-y;
		will-change: transform;
	}

	/* The settle animation — structural, because sliding is how the
	 * carousel works, not chrome. Suppressed during the drag so the track
	 * tracks the finger 1:1, and honored only when motion is welcome. Inert in
	 * rail, which never sets an inline transform. */
	@media (prefers-reduced-motion: no-preference) {
		.hz-carousel-track:not([data-dragging]) {
			transition: transform var(--hz-duration-base, 400ms) var(--hz-ease-standard, ease);
		}
	}

	.hz-carousel-slide {
		flex: 0 0 100%;
		min-width: 0;
	}

	/* Rail (specs/58): a native overflow-x scroller, several slides visible at
	 * once. The percentage in --hz-carousel-item-width's default resolves
	 * against the viewport, so the visible count falls out of container width
	 * (~5 at 1024px, ~6–7 at 1920px); the 9rem floor keeps a phone at ~2.5
	 * items with a peeking edge as the "there is more" affordance. */
	.hz-carousel[data-layout='rail'] .hz-carousel-viewport {
		overflow-x: auto;
		overflow-y: hidden;
		overscroll-behavior-x: contain;
		padding-block: var(--hz-carousel-rail-inset, 0.25rem);
	}

	/* No touch-action override — the browser owns the gesture entirely (pan,
	 * fling, wheel); the gap applies in rail only, since adding it in single
	 * mode would break the 100%-per-slide transform math. */
	.hz-carousel[data-layout='rail'] .hz-carousel-track {
		touch-action: auto;
		gap: var(--hz-carousel-gap, var(--hz-space-sm, 1rem));
	}

	.hz-carousel[data-layout='rail'] .hz-carousel-slide {
		flex: 0 0 var(--hz-carousel-item-width, clamp(9rem, 20%, 18rem));
		min-width: 0;
		/* Always set — inert unless the viewport's scroll-snap-type resolves to
		 * something other than none (the data-snap rule below, suppressed while
		 * dragging). */
		scroll-snap-align: start;
	}

	.hz-carousel[data-layout='rail'][data-snap] .hz-carousel-viewport {
		scroll-snap-type: x mandatory;
	}

	/* R6: snapping fights a live drag assignment every frame, so it's
	 * suppressed for the duration — one hook (data-dragging) on one element
	 * (the track), read here via :has() instead of a second copy on the
	 * viewport. Clearing it on release re-enables snap and the browser settles
	 * to the nearest point on its own. */
	.hz-carousel[data-layout='rail'] .hz-carousel-viewport:has(.hz-carousel-track[data-dragging]) {
		scroll-snap-type: none;
	}

	.hz-carousel-controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--hz-space-xs, 0.5rem);
	}

	/* Structural row only — dot visuals (size, circle, active state) are the
	 * theme's job. The pitch is set here because it's a touch-target concern
	 *: with an 8px dot, a 1rem gap gives a 24px slot, so each dot's hit
	 * area tiles the slot without overlapping its neighbor. */
	.hz-carousel-dots {
		display: flex;
		align-items: center;
		gap: var(--hz-space-sm, 1rem);
	}
</style>
