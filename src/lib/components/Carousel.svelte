<script lang="ts" generics="T">
	import { tick, type Snippet } from 'svelte';
	import { cx } from '$lib/utils';
	import IconChevronLeft from '$lib/icons/generated/chevron-left.svelte';
	import IconChevronRight from '$lib/icons/generated/chevron-right.svelte';
	import Button from './Button.svelte';

	interface Props {
		items: T[];
		/** Accessible name for the carousel region. Required. */
		ariaLabel: string;
		/** Active slide (bindable). */
		index?: number;
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
		loop = false,
		draggable = true,
		controls = 'visible',
		seamless = false,
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
	// effective behavior, never advertising a wrap that cannot happen.
	const seamlessActive = $derived(seamless && loop);

	function go(next: number) {
		if (count === 0) return;
		const target = loop ? (next + count) % count : Math.min(count - 1, Math.max(0, next));
		if (target !== index) {
			index = target;
			onchange?.(target);
		}
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

	function onpointerdown(e: PointerEvent) {
		if (!draggable || count <= 1) return;
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
				try {
					trackEl?.setPointerCapture(pointerId);
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
		dragOffset = resist(dx);
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
				trackEl?.releasePointerCapture(pointerId);
			} catch {
				// capture may already be gone (pointercancel) — ignore.
			}
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
	data-controls={controls}
	data-seamless={seamlessActive ? '' : undefined}
	onkeydown={onKeydown}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="hz-carousel-viewport" bind:this={viewportEl} aria-live="polite">
		<div
			class="hz-carousel-track"
			bind:this={trackEl}
			style:transform={displayTransform}
			style:cursor={draggable && count > 1 ? (dragging ? 'grabbing' : 'grab') : undefined}
			style:user-select={draggable && count > 1 ? 'none' : undefined}
			data-dragging={dragging ? '' : undefined}
			{onpointerdown}
			{onpointermove}
			{onpointerup}
			{onpointercancel}
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
			{#each items as item, i (i)}
				<div
					class="hz-carousel-slide"
					role="group"
					aria-roledescription="slide"
					aria-label={slideLabel ? slideLabel(item, i) : `${i + 1} of ${count}`}
					data-active={i === index ? '' : undefined}
					inert={i !== index}
				>
					{@render slide(item, i)}
				</div>
			{/each}
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
				disabled={!canPrev}
				onclick={() => step(-1)}
			>
				{#snippet iconStart()}<IconChevronLeft />{/snippet}
			</Button>
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
			<Button
				variant="ghost"
				intent="neutral"
				size="sm"
				class="hz-carousel-next"
				ariaLabel={nextLabel}
				disabled={!canNext}
				onclick={() => step(1)}
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

	/* The clip window — the track slides behind this. */
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
	 * tracks the finger 1:1, and honored only when motion is welcome. */
	@media (prefers-reduced-motion: no-preference) {
		.hz-carousel-track:not([data-dragging]) {
			transition: transform var(--hz-duration-base, 400ms) var(--hz-ease-standard, ease);
		}
	}

	.hz-carousel-slide {
		flex: 0 0 100%;
		min-width: 0;
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
