<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutPadding } from '$lib/types';
	import { cx } from '$lib/utils';

	type SplitFraction = '1/4' | '1/3' | '1/2' | '2/3' | '3/4' | 'auto';
	type SplitGap = 'none' | 'sm' | 'md' | 'lg' | 'near' | 'away';
	type SplitStackBelow = 'sm' | 'md' | 'lg';

	interface Props {
		fraction?: SplitFraction;
		gap?: SplitGap;
		reverse?: boolean;
		stackBelow?: SplitStackBelow;
		padding?: LayoutPadding;
		/** Per-axis override — wins over `padding` on the inline axis. */
		paddingInline?: LayoutPadding;
		/** Per-axis override — wins over `padding` on the block axis. */
		paddingBlock?: LayoutPadding;
		as?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	}

	let {
		fraction = '1/2',
		gap = 'md',
		reverse = false,
		stackBelow = 'sm',
		padding = 'none',
		paddingInline,
		paddingBlock,
		as = 'div',
		class: className,
		children,
		...rest
	}: Props = $props();
</script>

<!--
	{...rest} is spread first so that every subsequently-listed attribute
	(class, data-fraction, data-gap, data-reverse, data-stack-below,
	data-padding*) wins over any conflicting key a consumer accidentally
	passes through rest.
-->
<svelte:element
	this={as}
	{...rest}
	class={cx('hz-split', className)}
	data-fraction={fraction}
	data-gap={gap}
	data-reverse={reverse ? '' : undefined}
	data-stack-below={stackBelow}
	data-padding={padding}
	data-padding-inline={paddingInline}
	data-padding-block={paddingBlock}
>
	<div class="hz-split-layout">
		{@render children?.()}
	</div>
</svelte:element>

<style>
	/*
	 * Stacking uses the flex "switcher" pattern (Every Layout) instead of a
	 * container query, so the threshold resolves through var(): overriding
	 * --hz-width-sm/md/lg — globally or on any ancestor — retunes when the
	 * split stacks. Each column's flex-basis is (threshold − 100%) × 999:
	 * hugely positive while the split is narrower than the threshold (every
	 * column takes its own line), negative (floored to 0) once it's wider
	 * (columns share the line at their flex-grow ratio).
	 */
	.hz-split {
		display: block;
	}

	/* stackBelow → the width token the split stacks under (var-driven) */
	.hz-split[data-stack-below='sm'] {
		--_threshold: var(--hz-width-sm, 640px);
	}
	.hz-split[data-stack-below='md'] {
		--_threshold: var(--hz-width-md, 968px);
	}
	.hz-split[data-stack-below='lg'] {
		--_threshold: var(--hz-width-lg, 1200px);
	}

	.hz-split-layout {
		display: flex;
		flex-wrap: wrap;
	}

	.hz-split-layout > :global(*) {
		flex-grow: 1;
		flex-basis: calc((var(--_threshold, 640px) - 100%) * 999);
	}

	/*
	 * fraction → flex-grow ratio of the two columns (basis floors to 0 when
	 * side by side, so grow ratios become width ratios, subject to
	 * min-content). 'auto' sizes the first column to its content.
	 */
	.hz-split[data-fraction='1/4'] > .hz-split-layout > :global(:first-child) {
		flex-grow: 1;
	}
	.hz-split[data-fraction='1/4'] > .hz-split-layout > :global(:last-child) {
		flex-grow: 3;
	}
	.hz-split[data-fraction='1/3'] > .hz-split-layout > :global(:first-child) {
		flex-grow: 1;
	}
	.hz-split[data-fraction='1/3'] > .hz-split-layout > :global(:last-child) {
		flex-grow: 2;
	}
	.hz-split[data-fraction='2/3'] > .hz-split-layout > :global(:first-child) {
		flex-grow: 2;
	}
	.hz-split[data-fraction='2/3'] > .hz-split-layout > :global(:last-child) {
		flex-grow: 1;
	}
	.hz-split[data-fraction='3/4'] > .hz-split-layout > :global(:first-child) {
		flex-grow: 3;
	}
	.hz-split[data-fraction='3/4'] > .hz-split-layout > :global(:last-child) {
		flex-grow: 1;
	}
	.hz-split[data-fraction='auto'] > .hz-split-layout > :global(:first-child) {
		flex: 0 1 auto;
	}

	/* padding (both axes) per spacing scale — on the root, so the switcher's
	 * 100% is the space actually available to the columns.
	 * near/away are density-shift aware. */
	.hz-split[data-padding='none'] {
		padding: 0;
	}
	.hz-split[data-padding='sm'] {
		padding: var(--hz-space-sm, 1rem);
	}
	.hz-split[data-padding='md'] {
		padding: var(--hz-space-md, 2rem);
	}
	.hz-split[data-padding='lg'] {
		padding: var(--hz-space-lg, 4rem);
	}
	.hz-split[data-padding='near'] {
		padding: var(--hz-space-near, 4rem);
	}
	.hz-split[data-padding='away'] {
		padding: var(--hz-space-away, 8rem);
	}

	/* per-axis overrides — declared after the shorthand so the longhand wins */
	.hz-split[data-padding-inline='none'] {
		padding-inline: 0;
	}
	.hz-split[data-padding-inline='sm'] {
		padding-inline: var(--hz-space-sm, 1rem);
	}
	.hz-split[data-padding-inline='md'] {
		padding-inline: var(--hz-space-md, 2rem);
	}
	.hz-split[data-padding-inline='lg'] {
		padding-inline: var(--hz-space-lg, 4rem);
	}
	.hz-split[data-padding-inline='near'] {
		padding-inline: var(--hz-space-near, 4rem);
	}
	.hz-split[data-padding-inline='away'] {
		padding-inline: var(--hz-space-away, 8rem);
	}
	.hz-split[data-padding-block='none'] {
		padding-block: 0;
	}
	.hz-split[data-padding-block='sm'] {
		padding-block: var(--hz-space-sm, 1rem);
	}
	.hz-split[data-padding-block='md'] {
		padding-block: var(--hz-space-md, 2rem);
	}
	.hz-split[data-padding-block='lg'] {
		padding-block: var(--hz-space-lg, 4rem);
	}
	.hz-split[data-padding-block='near'] {
		padding-block: var(--hz-space-near, 4rem);
	}
	.hz-split[data-padding-block='away'] {
		padding-block: var(--hz-space-away, 8rem);
	}

	/* gap per spacing scale */
	.hz-split[data-gap='none'] > .hz-split-layout {
		gap: 0;
	}
	.hz-split[data-gap='sm'] > .hz-split-layout {
		gap: var(--hz-space-sm, 1rem);
	}
	.hz-split[data-gap='md'] > .hz-split-layout {
		gap: var(--hz-space-md, 2rem);
	}
	.hz-split[data-gap='lg'] > .hz-split-layout {
		gap: var(--hz-space-lg, 4rem);
	}

	/* density distances — shift-aware vars from the tokens.css density block */
	.hz-split[data-gap='near'] > .hz-split-layout {
		gap: var(--hz-space-near, 4rem);
	}
	.hz-split[data-gap='away'] > .hz-split-layout {
		gap: var(--hz-space-away, 8rem);
	}

	/*
	 * Visual swap when data-reverse is present.
	 * DOM / source order of children is unchanged; the swap is CSS-only
	 * via the `order` property, preserving logical reading and focus order.
	 */
	.hz-split[data-reverse] > .hz-split-layout > :global(:first-child) {
		order: 2;
	}
	.hz-split[data-reverse] > .hz-split-layout > :global(:last-child) {
		order: 1;
	}
</style>
