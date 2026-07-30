<script lang="ts">
	import { untrack } from 'svelte';
	import { DEV } from 'esm-env';
	import type { Rounded } from '$lib/types';
	import { cx } from '$lib/utils';

	// ---------------------------------------------------------------------------
	// Skeleton — a decorative loading placeholder. A small set of
	// shape variants (text lines, circle, rectangle, fill-the-box) with free
	// width/height/rounded overrides, composable into any card-like placeholder
	// in the consumer's own layout (Decision 3 — no card-skeleton prop). Always
	// aria-hidden: Loading announces, Skeleton decorates.
	// ---------------------------------------------------------------------------

	type SkeletonVariant = 'text' | 'circle' | 'rect' | 'block';
	type SkeletonAnimation = 'shimmer' | 'pulse' | 'none';

	interface Props {
		variant?: SkeletonVariant;
		width?: string | number;
		height?: string | number;
		rounded?: Rounded;
		/** text only. */
		lines?: number;
		/** text only, lines > 1. */
		lastLineWidth?: string | number;
		animation?: SkeletonAnimation;
		class?: string;
		[key: string]: unknown;
	}

	let {
		variant = 'text',
		width,
		height,
		rounded,
		lines = 1,
		lastLineWidth = '60%',
		animation = 'shimmer',
		class: className,
		...rest
	}: Props = $props();

	/** A number width/height/lastLineWidth is px; a string is verbatim. */
	function toCss(dim: string | number | undefined): string | undefined {
		if (dim === undefined) return undefined;
		return typeof dim === 'number' ? `${dim}px` : dim;
	}

	const DEFAULT_DIMS: Record<SkeletonVariant, { width: string; height: string }> = {
		text: { width: '100%', height: '1em' },
		circle: { width: '2.5rem', height: '2.5rem' },
		rect: { width: '100%', height: '1rem' },
		block: { width: '100%', height: '100%' }
	};

	const DEFAULT_ROUNDED: Record<SkeletonVariant, Rounded> = {
		text: 'sm',
		circle: 'full',
		rect: 'md',
		block: 'md'
	};

	// Circle squares from whichever of width/height is given; falls back
	// to the shared 2.5rem default when neither is set.
	const resolvedWidth = $derived.by((): string => {
		if (variant === 'circle') {
			return toCss(width) ?? toCss(height) ?? DEFAULT_DIMS.circle.width;
		}
		return toCss(width) ?? DEFAULT_DIMS[variant].width;
	});

	const resolvedHeight = $derived.by((): string => {
		if (variant === 'circle') {
			return toCss(height) ?? toCss(width) ?? DEFAULT_DIMS.circle.height;
		}
		return toCss(height) ?? DEFAULT_DIMS[variant].height;
	});

	const resolvedLastLineWidth = $derived(toCss(lastLineWidth) ?? '60%');

	// Circle forces full regardless of the rounded prop; every other
	// variant's default is overridable.
	const effectiveRounded: Rounded = $derived(
		variant === 'circle' ? 'full' : (rounded ?? DEFAULT_ROUNDED[variant])
	);

	// Lines is meaningful for text only; clamped to >= 1 elsewhere/on a
	// non-positive value.
	const effectiveLines = $derived(variant === 'text' ? Math.max(1, lines) : 1);
	const isMultiline = $derived(variant === 'text' && effectiveLines > 1);

	// The root is the single painted block unless it holds multiple
	// text lines, in which case the lines carry the dimensions instead.
	const rootStyle = $derived(
		isMultiline ? undefined : `width: ${resolvedWidth}; height: ${resolvedHeight};`
	);

	function lineStyle(index: number): string {
		const lineWidth = index === effectiveLines - 1 ? resolvedLastLineWidth : resolvedWidth;
		return `width: ${lineWidth}; height: ${resolvedHeight};`;
	}

	// A non-positive `lines` dev-warns once at creation and clamps to 1.
	if (DEV) {
		untrack(() => {
			if (variant === 'text' && lines <= 0) {
				console.warn('[hyzer-ui] <Skeleton>: `lines` must be at least 1. Clamped to 1.');
			}
		});
	}
</script>

<!--
	Root is a div carrying data-variant/data-animation/data-rounded.
	Aria-hidden="true" by default — placed BEFORE the rest spread (the
	one exception to the library's usual "rest first" convention) so a
	consumer can override it via rest for the rare case they want it exposed.
	class/data-*/style still come after rest, so those stay component-managed.
-->
<div
	aria-hidden="true"
	{...rest}
	class={cx('hz-skeleton', className)}
	data-variant={variant}
	data-animation={animation}
	data-rounded={effectiveRounded}
	style={rootStyle}
>
	{#if isMultiline}
		<!-- Lines stacked bars; the last one uses lastLineWidth so the
		     block reads like a real paragraph. -->
		{#each { length: effectiveLines }, i (i)}
			<span class="hz-skeleton-line" style={lineStyle(i)}></span>
		{/each}
	{/if}
</div>

<style>
	/* Structure only — multi-line text as a flex column with a token gap.
	 * Harmless as a bare block too: with no children, a flex container paints
	 * identically to a plain block. */
	.hz-skeleton {
		display: flex;
		flex-direction: column;
		gap: var(--hz-space-xs, 0.5rem);
	}

	.hz-skeleton-line {
		display: block;
	}
</style>
