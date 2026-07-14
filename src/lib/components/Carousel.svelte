<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { cx } from '$lib/utils';
	import IconChevronLeft from '$lib/icons/IconChevronLeft.svelte';
	import IconChevronRight from '$lib/icons/IconChevronRight.svelte';

	interface Props {
		items: T[];
		/** Accessible name for the carousel region. Required. */
		ariaLabel: string;
		/** Active slide (bindable). */
		index?: number;
		/** Wrap from the last slide to the first and vice versa. */
		loop?: boolean;
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
</script>

<!--
	APG grouped-content carousel. There is deliberately NO auto-rotation, so
	the slide viewport can be an aria-live=polite region: slide changes are
	announced via each slide's aria-label ("2 of 5" by default). Arrow keys
	work while focus is anywhere inside the carousel.
-->
<div
	{...rest}
	class={cx('hz-carousel', className)}
	role="group"
	aria-roledescription="carousel"
	aria-label={ariaLabel}
	onkeydown={onKeydown}
>
	<div class="hz-carousel-viewport" aria-live="polite">
		{#each items as item, i (i)}
			<div
				class="hz-carousel-slide"
				role="group"
				aria-roledescription="slide"
				aria-label={slideLabel ? slideLabel(item, i) : `${i + 1} of ${count}`}
				data-active={i === index ? '' : undefined}
				hidden={i !== index}
			>
				{@render slide(item, i)}
			</div>
		{/each}
	</div>

	{#if count > 1}
		<div class="hz-carousel-controls">
			<button
				type="button"
				class="hz-carousel-prev"
				aria-label={prevLabel}
				disabled={!canPrev}
				onclick={() => go(index - 1)}
			>
				<IconChevronLeft />
			</button>
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
			<button
				type="button"
				class="hz-carousel-next"
				aria-label={nextLabel}
				disabled={!canNext}
				onclick={() => go(index + 1)}
			>
				<IconChevronRight />
			</button>
		</div>
	{/if}
</div>

<style>
	.hz-carousel {
		display: block;
	}

	/* Belt and braces: [hidden] already hides, but guard against consumer
	 * display overrides on slides. */
	.hz-carousel-slide[hidden] {
		display: none;
	}

	.hz-carousel-controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--hz-space-xs, 0.5rem);
	}

	/* Structural row only — dot visuals (size, circle, active state) are the
	 * theme's job. */
	.hz-carousel-dots {
		display: flex;
		align-items: center;
		gap: var(--hz-space-xs, 0.5rem);
	}
</style>
