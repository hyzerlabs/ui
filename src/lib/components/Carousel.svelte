<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
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

	function go(next: number) {
		if (count === 0) return;
		const target = loop ? (next + count) % count : Math.min(count - 1, Math.max(0, next));
		if (target !== index) {
			index = target;
			onchange?.(target);
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			go(index - 1);
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			go(index + 1);
		} else if (e.key === 'Home') {
			e.preventDefault();
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
	// Did the gesture cross into a real drag? Gates click-through (R6).
	let dragged = false;
	// Recent (x, time) samples for the release velocity (R4).
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
		if (commit) {
			// Decide from the raw pointer delta, not the damped visual offset, so a
			// flick at a rubber-banding end still registers.
			const passedHalf = Math.abs(lastDx) > viewportWidth() * 0.5;
			const flicked = Math.abs(releaseVelocity()) > FLICK_VELOCITY;
			if ((passedHalf || flicked) && lastDx !== 0) {
				// Step one neighbor and defer to go(): it clamps when loop is off and
				// wraps when it's on, so drag loops exactly when the consumer opts in.
				target = index + (lastDx < 0 ? 1 : -1);
			}
		}
		// Clear the drag first (re-enables the transition), then move: the track
		// animates in one smooth settle from where the finger left it to rest.
		dragging = false;
		dragOffset = 0;
		pointerId = null;
		axis = 'undecided';
		go(target);
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
	// handler; one-shot, so a subsequent real click passes through (R6).
	function onclickcapture(e: MouseEvent) {
		if (dragged) {
			e.preventDefault();
			e.stopPropagation();
			dragged = false;
		}
	}

	// translateX in one expression: rest position plus the live drag offset.
	const trackTransform = $derived(`translateX(calc(-1 * ${index} * 100% + ${dragOffset}px))`);
</script>

<!--
	APG grouped-content carousel. There is deliberately NO auto-rotation, so
	the slide viewport can be an aria-live=polite region: slide changes are
	announced via each slide's aria-label ("2 of 5" by default). Arrow keys
	work while focus is anywhere inside the carousel. The slides sit in a
	sliding track (R1); off-screen slides are inert (R2) so only the active
	one is exposed and focusable.
-->
<div
	{...rest}
	class={cx('hz-carousel', className)}
	role="group"
	aria-roledescription="carousel"
	aria-label={ariaLabel}
	onkeydown={onKeydown}
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="hz-carousel-viewport" bind:this={viewportEl} aria-live="polite">
		<div
			class="hz-carousel-track"
			bind:this={trackEl}
			style:transform={trackTransform}
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
		</div>
	</div>

	{#if count > 1}
		<div class="hz-carousel-controls">
			<Button
				variant="outline"
				intent="neutral"
				size="sm"
				class="hz-carousel-prev"
				ariaLabel={prevLabel}
				disabled={!canPrev}
				onclick={() => go(index - 1)}
			>
				{#snippet iconStart()}<IconChevronLeft />{/snippet}
			</Button>
			{#if indicator === 'dots'}
				<!-- Slide pickers: each dot is a labelled button (aria-current marks
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
							onclick={() => go(i)}
						></button>
					{/each}
				</div>
			{:else}
				<!-- Decorative — the live region announces "{n} of {total}" already. -->
				<span class="hz-carousel-status" aria-hidden="true">{index + 1} / {count}</span>
			{/if}
			<Button
				variant="outline"
				intent="neutral"
				size="sm"
				class="hz-carousel-next"
				ariaLabel={nextLabel}
				disabled={!canNext}
				onclick={() => go(index + 1)}
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

	/* The settle animation (R7) — structural, because sliding is how the
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
	 * (R8): with an 8px dot, a 1rem gap gives a 24px slot, so each dot's hit
	 * area tiles the slot without overlapping its neighbor. */
	.hz-carousel-dots {
		display: flex;
		align-items: center;
		gap: var(--hz-space-sm, 1rem);
	}
</style>
