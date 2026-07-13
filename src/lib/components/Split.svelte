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
		as = 'div',
		class: className,
		children,
		...rest
	}: Props = $props();
</script>

<!--
	{...rest} is spread first so that every subsequently-listed attribute
	(class, data-fraction, data-gap, data-reverse, data-stack-below,
	data-padding) wins over any conflicting key a consumer accidentally
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
>
	<div class="hz-split-layout">
		{@render children?.()}
	</div>
</svelte:element>

<style>
	/*
	 * The root is a size container so the stackBelow breakpoint responds to
	 * the split's own available width (container queries), not the viewport.
	 * An element cannot container-query itself, so the inner .hz-split-layout
	 * does the actual grid layout.
	 *
	 * stackBelow maps to the width tokens: sm = --hz-width-sm (640px),
	 * md = --hz-width-md (968px), lg = --hz-width-lg (1200px) of container
	 * width. Thresholds stay literal — CSS cannot read custom properties in
	 * container queries.
	 */
	.hz-split {
		display: block;
		container-type: inline-size;
	}

	.hz-split-layout {
		display: grid;
	}

	/*
	 * Map each fraction to an internal CSS custom property --_cols.
	 * Set on the root (stylesheet-internal, not emitted as inline style) and
	 * inherited by the layout element, which consumes it in the container
	 * query rules below.
	 */
	.hz-split[data-fraction='1/4'] {
		--_cols: 1fr 3fr;
	}
	.hz-split[data-fraction='1/3'] {
		--_cols: 1fr 2fr;
	}
	.hz-split[data-fraction='1/2'] {
		--_cols: 1fr 1fr;
	}
	.hz-split[data-fraction='2/3'] {
		--_cols: 2fr 1fr;
	}
	.hz-split[data-fraction='3/4'] {
		--_cols: 3fr 1fr;
	}
	.hz-split[data-fraction='auto'] {
		--_cols: auto 1fr;
	}

	/* padding (both axes) per spacing scale — on the root, so the container
	 * queries measure the space actually available to the columns.
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
		padding: var(--hz-space-near, 2rem);
	}
	.hz-split[data-padding='away'] {
		padding: var(--hz-space-away, 4rem);
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
		gap: var(--hz-space-near, 2rem);
	}
	.hz-split[data-gap='away'] > .hz-split-layout {
		gap: var(--hz-space-away, 4rem);
	}

	/*
	 * Un-stack into two columns at the data-stack-below container width.
	 * Narrow-first: single column by default (auto-flow).
	 */
	@container (min-width: 640px) {
		.hz-split[data-stack-below='sm'] > .hz-split-layout {
			grid-template-columns: var(--_cols);
		}
	}

	@container (min-width: 968px) {
		.hz-split[data-stack-below='md'] > .hz-split-layout {
			grid-template-columns: var(--_cols);
		}
	}

	@container (min-width: 1200px) {
		.hz-split[data-stack-below='lg'] > .hz-split-layout {
			grid-template-columns: var(--_cols);
		}
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
