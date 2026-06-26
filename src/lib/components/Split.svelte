<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cx } from '$lib/utils';

	type SplitFraction = '1/4' | '1/3' | '1/2' | '2/3' | '3/4' | 'auto';
	type SplitGap = 'none' | 'sm' | 'md' | 'lg';
	type SplitStackBelow = 'sm' | 'md' | 'lg';

	interface Props {
		fraction?: SplitFraction;
		gap?: SplitGap;
		reverse?: boolean;
		stackBelow?: SplitStackBelow;
		as?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	}

	let {
		fraction = '1/2',
		gap = 'md',
		reverse = false,
		stackBelow = 'md',
		as = 'div',
		class: className,
		children,
		...rest
	}: Props = $props();
</script>

<!--
	{...rest} is spread first so that every subsequently-listed attribute
	(class, data-fraction, data-gap, data-reverse, data-stack-below) wins over
	any conflicting key a consumer accidentally passes through rest.
-->
<svelte:element
	this={as}
	{...rest}
	class={cx('hz-split', className)}
	data-fraction={fraction}
	data-gap={gap}
	data-reverse={reverse ? '' : undefined}
	data-stack-below={stackBelow}
>
	{@render children?.()}
</svelte:element>

<style>
	.hz-split {
		display: grid;
	}

	/*
	 * Map each fraction to an internal CSS custom property --_cols.
	 * This is a stylesheet-internal variable (not emitted as inline style)
	 * consumed by the breakpoint rules below.
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

	/* gap per spacing scale */
	.hz-split[data-gap='none'] {
		gap: 0;
	}
	.hz-split[data-gap='sm'] {
		gap: var(--hz-space-sm, 0.5rem);
	}
	.hz-split[data-gap='md'] {
		gap: var(--hz-space-md, 1rem);
	}
	.hz-split[data-gap='lg'] {
		gap: var(--hz-space-lg, 1.5rem);
	}

	/*
	 * Un-stack into two columns at the data-stack-below breakpoint.
	 * Mobile-first: single column by default (auto-flow).
	 */
	@media (min-width: 640px) {
		.hz-split[data-stack-below='sm'] {
			grid-template-columns: var(--_cols);
		}
	}

	@media (min-width: 968px) {
		.hz-split[data-stack-below='md'] {
			grid-template-columns: var(--_cols);
		}
	}

	@media (min-width: 1200px) {
		.hz-split[data-stack-below='lg'] {
			grid-template-columns: var(--_cols);
		}
	}

	/*
	 * Visual swap when data-reverse is present.
	 * DOM / source order of children is unchanged; the swap is CSS-only
	 * via the `order` property, preserving logical reading and focus order.
	 */
	:global(.hz-split[data-reverse] > :first-child) {
		order: 2;
	}
	:global(.hz-split[data-reverse] > :last-child) {
		order: 1;
	}
</style>
