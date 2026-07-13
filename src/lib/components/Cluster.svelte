<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutAlign, LayoutPadding } from '$lib/types';
	import { cx } from '$lib/utils';

	type ClusterGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'near' | 'away';
	type ClusterJustify = 'start' | 'center' | 'end' | 'between' | 'around';

	interface Props {
		gap?: ClusterGap;
		justify?: ClusterJustify;
		align?: LayoutAlign;
		wrap?: boolean;
		padding?: LayoutPadding;
		as?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	}

	let {
		gap = 'sm',
		justify = 'start',
		align = 'center',
		wrap = true,
		padding = 'none',
		as = 'div',
		class: className,
		children,
		...rest
	}: Props = $props();
</script>

<!--
	{...rest} is spread first so that every subsequently-listed attribute
	(class, data-gap, data-justify, data-align, data-wrap, data-padding) wins
	over any conflicting key a consumer accidentally passes through rest.
-->
<svelte:element
	this={as}
	{...rest}
	class={cx('hz-cluster', className)}
	data-gap={gap}
	data-justify={justify}
	data-align={align}
	data-wrap={wrap ? '' : undefined}
	data-padding={padding}
>
	{@render children?.()}
</svelte:element>

<style>
	.hz-cluster {
		display: flex;
	}

	/* flex-wrap per data-wrap */
	.hz-cluster[data-wrap] {
		flex-wrap: wrap;
	}
	.hz-cluster:not([data-wrap]) {
		flex-wrap: nowrap;
	}

	/* gap per spacing scale */
	.hz-cluster[data-gap='none'] {
		gap: 0;
	}
	.hz-cluster[data-gap='xs'] {
		gap: var(--hz-space-xs, 0.5rem);
	}
	.hz-cluster[data-gap='sm'] {
		gap: var(--hz-space-sm, 1rem);
	}
	.hz-cluster[data-gap='md'] {
		gap: var(--hz-space-md, 2rem);
	}
	.hz-cluster[data-gap='lg'] {
		gap: var(--hz-space-lg, 4rem);
	}

	/* density distances — shift-aware vars from the tokens.css density block */
	.hz-cluster[data-gap='near'] {
		gap: var(--hz-space-near, 2rem);
	}
	.hz-cluster[data-gap='away'] {
		gap: var(--hz-space-away, 4rem);
	}

	/* padding (both axes) per spacing scale — near/away are density-shift aware */
	.hz-cluster[data-padding='none'] {
		padding: 0;
	}
	.hz-cluster[data-padding='sm'] {
		padding: var(--hz-space-sm, 1rem);
	}
	.hz-cluster[data-padding='md'] {
		padding: var(--hz-space-md, 2rem);
	}
	.hz-cluster[data-padding='lg'] {
		padding: var(--hz-space-lg, 4rem);
	}
	.hz-cluster[data-padding='near'] {
		padding: var(--hz-space-near, 2rem);
	}
	.hz-cluster[data-padding='away'] {
		padding: var(--hz-space-away, 4rem);
	}

	/* justify-content per data-justify */
	.hz-cluster[data-justify='start'] {
		justify-content: flex-start;
	}
	.hz-cluster[data-justify='center'] {
		justify-content: center;
	}
	.hz-cluster[data-justify='end'] {
		justify-content: flex-end;
	}
	.hz-cluster[data-justify='between'] {
		justify-content: space-between;
	}
	.hz-cluster[data-justify='around'] {
		justify-content: space-around;
	}

	/* align-items per data-align */
	.hz-cluster[data-align='start'] {
		align-items: flex-start;
	}
	.hz-cluster[data-align='center'] {
		align-items: center;
	}
	.hz-cluster[data-align='end'] {
		align-items: flex-end;
	}
	.hz-cluster[data-align='baseline'] {
		align-items: baseline;
	}
	.hz-cluster[data-align='stretch'] {
		align-items: stretch;
	}
</style>
